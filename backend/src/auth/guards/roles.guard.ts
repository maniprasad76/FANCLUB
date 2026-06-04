import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — Role-Based Access Control guard.
 *
 * Reads allowed roles from the @Roles() decorator metadata and checks
 * if the current user's role is in the allowed list.
 *
 * If no @Roles() decorator is present on the handler, access is granted
 * (the route is unprotected by role — auth-only via JwtAuthGuard).
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('ADMIN')
 *   @Post('products')
 *
 * This replaces the hardcoded AdminGuard for new endpoints and supports
 * future role expansion (MODERATOR, SUPPORT, etc.) without code changes.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — allow access (role-unprotected endpoint)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Access restricted. Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
