import { Controller, Post, Body, Get, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, ForgotPasswordDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/** Cookie options for the JWT access token */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /** 5 attempts per 60 seconds — brute-force protection */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('signup')
  async signUp(@Body() dto: SignUpDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.signUp(dto);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    // Return user data, session (with refresh_token for client storage)
    return {
      user: result.user,
      session: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
      },
    };
  }

  /** 5 attempts per 60 seconds — brute-force protection */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('signin')
  async signIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.signIn(dto);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    return {
      user: result.user,
      session: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
      },
    };
  }

  /** 5 attempts per 60 seconds — brute-force protection */
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('admin/signin')
  async adminSignIn(@Body() dto: SignInDto, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.adminSignIn(dto);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    return {
      user: result.user,
      session: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
      },
    };
  }

  /**
   * Refresh an expired JWT using the Supabase refresh_token.
   * The client sends the refresh_token; we get a new access_token
   * and set it as an httpOnly cookie.
   */
  @SkipThrottle()
  @Post('refresh')
  async refreshSession(@Body('refresh_token') refreshToken: string, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.refreshSession(refreshToken);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    return {
      user: result.user,
      session: {
        access_token: result.session?.access_token,
        refresh_token: result.session?.refresh_token,
      },
    };
  }

  @Post('user/oauth/sync')
  async syncUserOAuth(@Body('access_token') accessToken: string, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.syncOAuth(accessToken, false);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    return { user: result.user, session: result.session };
  }

  @Post('admin/oauth/sync')
  async syncAdminOAuth(@Body('access_token') accessToken: string, @Res({ passthrough: true }) res: any) {
    const result = await this.authService.syncOAuth(accessToken, true);
    if (result.session?.access_token) {
      res.cookie('access_token', result.session.access_token, COOKIE_OPTIONS);
    }
    return { user: result.user, session: result.session };
  }

  @SkipThrottle()
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser('authId') authId: string) {
    return this.authService.getProfile(authId);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Body('redirectTo') redirectTo: string) {
    return this.authService.forgotPassword(dto.email, redirectTo);
  }
}
