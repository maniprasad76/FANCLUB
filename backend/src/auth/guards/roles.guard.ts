import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard — Reflector-based role authorization.
 *
 * Reads @Roles() metadata from the route handler and checks if
 * req.user.role matches any of the required roles.
 *
 * Must be used AFTER JwtAuthGuard (which attaches req.user).
 *
 * If no @Roles() decorator is present, access is granted (opt-in model).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Roles() decorator, allow access (opt-in, not opt-out)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url } = request;

    if (!user || !requiredRoles.includes(user.role)) {
      this.logger.warn(
        `🚫 Role access denied — user=${user?.id || 'unknown'} role=${user?.role || 'none'} required=${requiredRoles.join(',')} → ${method} ${url}`,
      );
      throw new ForbiddenException(
        `Access restricted to ${requiredRoles.join(' or ')} role`,
      );
    }

    this.logger.log(
      `🔑 Role access granted — user=${user.id} role=${user.role} → ${method} ${url}`,
    );

    return true;
  }
}
