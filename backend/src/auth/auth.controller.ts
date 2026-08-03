import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccountLockoutInterceptor } from '../common/interceptors/account-lockout.interceptor';

import type { Request } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { SignInDto } from './dto/signin.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { SignUpSchema, SignInSchema } from './auth-validation.js';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ─── POST /auth/signup ─────────────────────────────────────

  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignUpDto) {
    try {
      const validated = SignUpSchema.parse(dto);
      return this.authService.signUp(
        validated.email,
        validated.password,
        validated.name,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.warn(
          `Sign-up validation failed: ${JSON.stringify(error.issues)}`,
        );
      } else {
        this.logger.error(`Unexpected sign-up validation error: ${error}`);
      }
      throw new BadRequestException('Invalid registration details provided.');
    }
  }

  // ─── POST /auth/signin ────────────────────────────────────

  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @UseInterceptors(AccountLockoutInterceptor)
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: SignInDto) {
    try {
      const validated = SignInSchema.parse(dto);
      return this.authService.signIn(validated.email, validated.password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        this.logger.warn(
          `Sign-in validation failed: ${JSON.stringify(error.issues)}`,
        );
      } else {
        this.logger.error(`Unexpected sign-in validation error: ${error}`);
      }
      throw new BadRequestException(
        'Invalid email or password. Please try again.',
      );
    }
  }

  // ─── POST /auth/admin/signin ──────────────────────────────

  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @UseInterceptors(AccountLockoutInterceptor)
  @Post('admin/signin')
  @HttpCode(HttpStatus.OK)
  async adminSignIn(@Body() dto: SignInDto) {
    try {
      const validated = SignInSchema.parse(dto);
      const result = await this.authService.signIn(
        validated.email,
        validated.password,
      );
      if (result.user.role !== 'ADMIN') {
        throw new UnauthorizedException('Access restricted to administrators');
      }
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        this.logger.warn(
          `Admin sign-in validation failed: ${JSON.stringify(error.issues)}`,
        );
        throw new BadRequestException(
          'Invalid email or password. Please try again.',
        );
      } else {
        this.logger.error(
          `Unexpected admin sign-in validation error: ${error}`,
        );
        throw new BadRequestException(
          'Invalid email or password. Please try again.',
        );
      }
    }
  }

  // ─── POST /auth/forgot-password ───────────────────────────

  @Throttle({ strict: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email, dto.redirectTo);
  }

  // ─── POST /auth/refresh ───────────────────────────────────

  @Throttle({ strict: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  // ─── POST /auth/logout ───────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const token = this.extractTokenFromHeader(req);
    return this.authService.logout(token || '');
  }

  // ─── GET /auth/profile ───────────────────────────────────

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser('authId') authId: string) {
    return this.authService.getProfile(authId);
  }

  // ─── POST /auth/user/oauth/sync ──────────────────────────

  @Post('user/oauth/sync')
  @HttpCode(HttpStatus.OK)
  async syncOAuthUser(@Body() body: { access_token: string }) {
    return this.authService.syncOAuthUser(body.access_token);
  }

  // ─── POST /auth/admin/oauth/sync ──────────────────────────

  @Post('admin/oauth/sync')
  @HttpCode(HttpStatus.OK)
  async syncAdminOAuthUser(@Body() body: { access_token: string }) {
    const result = await this.authService.syncOAuthUser(body.access_token);
    if (result.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Access restricted to administrators');
    }
    return result;
  }

  // ─── PRIVATE HELPERS ─────────────────────────────────────

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
  }
}
