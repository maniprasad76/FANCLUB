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
      const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
      this.logger.warn(
        `🚫 Admin access denied — user=${user?.id || 'unknown'} email=${user?.email || 'unknown'} ip=${ip} → ${method} ${url} [${new Date().toISOString()}]`,
      );
      throw new ForbiddenException('Admin access required');
    }

    // Audit trail — log successful admin access with IP and timestamp for compliance
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    this.logger.log(
      `🔑 Admin access — user=${user.id} email=${user.email} ip=${ip} → ${method} ${url} [${new Date().toISOString()}]`,
    );

    return true;
  }
}
