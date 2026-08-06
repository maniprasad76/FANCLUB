import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { AdminSeederService } from './admin-seeder.service.js';
import { AccountLockoutInterceptor } from '../common/interceptors/account-lockout.interceptor.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    AdminGuard,
    AdminSeederService,
    AccountLockoutInterceptor,
  ],
  exports: [AuthService, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
