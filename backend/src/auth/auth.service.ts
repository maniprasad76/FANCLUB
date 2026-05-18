import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, SignInDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_ANON_KEY')!,
    );
    this.supabaseAdmin = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async signUp(dto: SignUpDto) {
    // Check local DB first
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists. Please sign in instead.');

    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: { data: { name: dto.name } },
    });

    if (error) {
      // Supabase may say "User already registered"
      if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already been registered')) {
        throw new ConflictException('An account with this email already exists. Please sign in instead.');
      }
      throw new UnauthorizedException(error.message);
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        authId: data.user!.id,
        role: 'USER',
      },
    });

    return {
      user,
      session: data.session,
    };
  }

  async signIn(dto: SignInDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('invalid login credentials')) {
        // Check if user even exists to give a better message
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!existingUser) {
          throw new UnauthorizedException('No account found with this email. Please sign up first.');
        }
        throw new UnauthorizedException('Incorrect password. Please try again or reset your password.');
      }
      throw new UnauthorizedException(error.message);
    }

    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      // User exists in Supabase but not in our DB — create them
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: data.user.user_metadata?.name || dto.email.split('@')[0],
          authId: data.user.id,
          role: 'USER',
        },
      });
    }

    return {
      user,
      session: data.session,
    };
  }

  async adminSignIn(dto: SignInDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) throw new UnauthorizedException('Invalid credentials');

    // Upsert user — first login after setup script may not have DB record
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user) {
      // Create as ADMIN on first admin login
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: data.user?.user_metadata?.name || 'Admin',
          authId: data.user!.id,
          role: 'ADMIN',
        },
      });
    } else if (user.role !== 'ADMIN') {
      // Promote existing user to ADMIN
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN', authId: data.user!.id },
      });
    }

    return {
      user,
      session: data.session,
    };
  }

  /**
   * Refresh an expired session using Supabase refresh_token.
   * Returns a brand new access_token + refresh_token pair.
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error || !data.session) {
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    // Ensure user exists in our DB
    let user = await this.prisma.user.findUnique({ where: { authId: data.user!.id } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: data.user!.email!,
          name: data.user!.user_metadata?.name || data.user!.email!.split('@')[0],
          authId: data.user!.id,
          role: 'USER',
        },
      });
    }

    return {
      user,
      session: data.session,
    };
  }

  async getProfile(authId: string) {
    return this.prisma.user.findUnique({
      where: { authId },
      include: { addresses: true },
    });
  }

  async syncOAuth(accessToken: string, requireAdmin: boolean = false) {
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
    if (error || !user) throw new UnauthorizedException('Invalid OAuth session');

    let dbUser = await this.prisma.user.findUnique({ where: { authId: user.id } });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
          avatar: user.user_metadata?.avatar_url,
          authId: user.id,
          role: 'USER',
        },
      });
    }

    if (requireAdmin && dbUser.role !== 'ADMIN') {
      throw new UnauthorizedException('Admin access denied');
    }

    return {
      user: dbUser,
      session: { access_token: accessToken },
    };
  }

  async forgotPassword(email: string, redirectTo: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Password reset link sent successfully' };
  }
}
