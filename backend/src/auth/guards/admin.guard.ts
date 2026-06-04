import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const { method, url } = request;

    if (user?.role !== 'ADMIN') {
      this.logger.warn(
        `🚫 Admin access denied — user=${user?.id || 'unknown'} email=${user?.email || 'unknown'} → ${method} ${url}`,
      );
      throw new ForbiddenException('Admin access required');
    }

    // Audit trail — log successful admin access
    this.logger.log(
      `🔑 Admin access — user=${user.id} email=${user.email} → ${method} ${url}`,
    );

    return true;
  }
}

