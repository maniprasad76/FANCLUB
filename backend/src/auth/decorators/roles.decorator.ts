import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator — declarative role-based access control.
 *
 * Instead of manually stacking @UseGuards(JwtAuthGuard, AdminGuard),
 * use @Roles('ADMIN') with the RolesGuard for cleaner code.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   @Post('products')
 *   createProduct() { ... }
 *
 * Multiple roles:
 *   @Roles('ADMIN', 'MODERATOR')  // OR logic — any role grants access
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
