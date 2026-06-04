import { SetMetadata } from '@nestjs/common';

/**
 * @Roles decorator — sets metadata on a route handler specifying which roles
 * are allowed to access it. Used in conjunction with RolesGuard.
 *
 * @example
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   @Post('products')
 *   create() { ... }
 *
 *   // Multiple roles
 *   @Roles('ADMIN', 'MODERATOR')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
