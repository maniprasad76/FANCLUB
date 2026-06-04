import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service.js';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserProfile,
  AuthResult,
  SignUpResult,
  OAuthSyncResult,
  ForgotPasswordResult,
  LogoutResult,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // ─── SIGN UP ────────────────────────────────────────────────

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<SignUpResult> {
    const client = this.supabaseService.getClient();
    const normalizedEmail = email.toLowerCase();

    try {
      // Check if user already exists in local DB
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message:
              'An account with this email already exists. Please sign in instead.',
          },
          HttpStatus.CONFLICT,
        );
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } =
        await client.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true, // Auto-confirm email for smooth UX
          user_metadata: { name },
        });

      if (authError) {
        this.logger.error(`Supabase signup error: ${authError.message}`);

        if (
          authError.message.includes('already registered') ||
          authError.message.includes('already exists')
        ) {
          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message:
                'An account with this email already exists. Please sign in instead.',
            },
            HttpStatus.CONFLICT,
          );
        }
        throw new BadRequestException(authError.message);
      }

      if (!authData.user) {
        throw new BadRequestException('Failed to create user account');
      }

      // Create user in local Prisma DB — handle race condition (double-click /
      // concurrent requests) where two signUp calls pass the findUnique check
      // above, both create Supabase users, and then race on the Prisma insert.
      let dbUser;
      try {
        dbUser = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            name,
            authId: authData.user.id,
            role: 'USER',
          },
        });
      } catch (prismaError: any) {
        // Prisma P2002 = unique constraint violation (email or authId already taken)
        if (prismaError?.code === 'P2002') {
          this.logger.warn(
            `Race condition detected for ${normalizedEmail} — cleaning up orphaned Supabase user ${authData.user.id}`,
          );

          // Roll back the Supabase user we just created to avoid orphans
          try {
            await client.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            this.logger.error(
              `Failed to clean up orphaned Supabase user ${authData.user.id}: ${(cleanupError as Error).message}`,
            );
          }

          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              message:
                'An account with this email already exists. Please sign in instead.',
            },
            HttpStatus.CONFLICT,
          );
        }

        // Re-throw any other Prisma error
        throw prismaError;
      }

      this.logger.log(`New user registered: ${normalizedEmail}`);

      // Sign in immediately to get session tokens
      const { data: signInData, error: signInError } =
        await client.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      const session = signInData?.session
        ? {
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
          }
        : null;

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone,
          avatar: dbUser.avatar,
          role: dbUser.role,
        },
        session,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`signUp error: ${(error as Error).message}`);
      throw new BadRequestException('Registration failed');
    }
  }

  // ─── SIGN IN ────────────────────────────────────────────────

  async signIn(
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const client = this.supabaseService.getClient();

    try {
      // Authenticate via Supabase Auth
      const { data, error } = await client.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (error) {
        this.logger.warn(`Sign-in failed for ${email}: ${error.message}`);

        if (error.message.includes('Invalid login credentials')) {
          // Check if the account exists at all
          const existingUser = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!existingUser) {
            throw new UnauthorizedException(
              'No account found with this email. Please sign up first.',
            );
          }

          throw new UnauthorizedException(
            'Incorrect password. Please try again or reset your password.',
          );
        }

        throw new UnauthorizedException(error.message);
      }

      if (!data.session || !data.user) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Find user in local DB
      let dbUser = await this.prisma.user.findUnique({
        where: { authId: data.user.id },
      });

      // If user doesn't exist in local DB (e.g. created directly in Supabase),
      // create a local record
      if (!dbUser) {
        dbUser = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: data.user.user_metadata?.name || null,
            authId: data.user.id,
            role: 'USER',
          },
        });
        this.logger.log(`Local user created on sign-in for ${email}`);
      }

      this.logger.log(`User signed in: ${email}`);

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone,

          avatar: dbUser.avatar,
          role: dbUser.role,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`signIn error: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  // ─── FORGOT PASSWORD ───────────────────────────────────────

  async forgotPassword(
    email: string,
    redirectTo?: string,
  ): Promise<ForgotPasswordResult> {
    const client = this.supabaseService.getClient();

    try {
      const { error } = await client.auth.resetPasswordForEmail(
        email.toLowerCase(),
        {
          redirectTo: redirectTo || undefined,
        },
      );

      if (error) {
        this.logger.error(
          `Forgot password error for ${email}: ${error.message}`,
        );
        // Don't reveal whether the email exists — always show success
      }

      // Always return success to prevent email enumeration
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    } catch (error) {
      this.logger.error(`forgotPassword error: ${(error as Error).message}`);
      // Still return success to prevent enumeration
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }
  }

  // ─── REFRESH TOKEN ──────────────────────────────────────────

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const client = this.supabaseService.getClient();

    try {
      const { data, error } = await client.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session || !data.user) {
        throw new UnauthorizedException(
          'Session expired. Please sign in again.',
        );
      }

      // Fetch user from local DB
      const dbUser = await this.prisma.user.findUnique({
        where: { authId: data.user.id },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone,
          avatar: dbUser.avatar,
          role: dbUser.role,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`refreshToken error: ${(error as Error).message}`);
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }
  }

  // ─── LOGOUT ─────────────────────────────────────────────────

  async logout(accessToken: string): Promise<LogoutResult> {
    const client = this.supabaseService.getClient();

    try {
      // Use admin API to sign out user by their access token
      const {
        data: { user },
      } = await client.auth.getUser(accessToken);

      if (user) {
        await client.auth.admin.signOut(user.id);
      }

      this.logger.log('User logged out');
      return { success: true };
    } catch (error) {
      this.logger.error(`Logout error: ${(error as Error).message}`);
      // Still return success — user should be logged out client-side regardless
      return { success: true };
    }
  }

  // ─── GET PROFILE ────────────────────────────────────────────

  async getProfile(authId: string): Promise<UserProfile> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { authId },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`getProfile error: ${(error as Error).message}`);
      throw new UnauthorizedException('Failed to fetch profile');
    }
  }

  // ─── SYNC OAUTH USER ───────────────────────────────────────

  /**
   * Called after a successful OAuth login (Google/Facebook).
   * The frontend sends the Supabase access_token, we validate it
   * and upsert the user in our local Prisma DB.
   */
  async syncOAuthUser(accessToken: string): Promise<OAuthSyncResult> {
    const client = this.supabaseService.getClient();

    try {
      // Validate the access token and get user info
      const {
        data: { user: authUser },
        error,
      } = await client.auth.getUser(accessToken);

      if (error || !authUser) {
        this.logger.error(
          `OAuth sync failed: ${error?.message || 'No user returned'}`,
        );
        throw new UnauthorizedException('Invalid OAuth token');
      }

      const email = authUser.email;
      if (!email) {
        throw new BadRequestException('OAuth account has no email');
      }

      // Upsert user in local DB
      let dbUser = await this.prisma.user.findUnique({
        where: { authId: authUser.id },
      });

      if (!dbUser) {
        // Check if user exists by email (could have registered with email first)
        dbUser = await this.prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (dbUser) {
          // Link existing local user to this OAuth identity
          dbUser = await this.prisma.user.update({
            where: { id: dbUser.id },
            data: {
              authId: authUser.id,
              avatar:
                dbUser.avatar ||
                authUser.user_metadata?.avatar_url ||
                authUser.user_metadata?.picture ||
                null,
              name:
                dbUser.name ||
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                null,
            },
          });
          this.logger.log(`OAuth user linked to existing account: ${email}`);
        } else {
          // Create new user
          dbUser = await this.prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name:
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name ||
                null,
              avatar:
                authUser.user_metadata?.avatar_url ||
                authUser.user_metadata?.picture ||
                null,
              authId: authUser.id,
              role: 'USER',
            },
          });
          this.logger.log(`New OAuth user created: ${email}`);
        }
      } else {
        // Update avatar/name from OAuth provider if not set locally
        const updates: any = {};
        if (
          !dbUser.avatar &&
          (authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture)
        ) {
          updates.avatar =
            authUser.user_metadata.avatar_url || authUser.user_metadata.picture;
        }
        if (
          !dbUser.name &&
          (authUser.user_metadata?.full_name || authUser.user_metadata?.name)
        ) {
          updates.name =
            authUser.user_metadata.full_name || authUser.user_metadata.name;
        }

        if (Object.keys(updates).length > 0) {
          dbUser = await this.prisma.user.update({
            where: { id: dbUser.id },
            data: updates,
          });
        }
      }

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone,
          avatar: dbUser.avatar,
          role: dbUser.role,
        },
        session: {
          access_token: accessToken,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`syncOAuthUser error: ${(error as Error).message}`);
      throw new BadRequestException('OAuth sync failed');
    }
  }
}
