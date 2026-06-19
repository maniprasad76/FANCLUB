import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { AdminGuard } from './guards/admin.guard.js';
import { OwnershipGuard } from './guards/ownership.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AdminSeederService } from './admin-seeder.service.js';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    AdminGuard,
    OwnershipGuard,
    RolesGuard,
    AdminSeederService,
  ],
  exports: [AuthService, JwtAuthGuard, AdminGuard, OwnershipGuard, RolesGuard],
})
export class AuthModule {}
