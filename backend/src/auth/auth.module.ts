import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AdminSeederService } from './admin-seeder.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminSeederService],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
