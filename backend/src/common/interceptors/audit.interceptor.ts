import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, tap } from 'rxjs';
import {
  AUDIT_METADATA_KEY,
  AuditMetadata,
} from '../../audit/decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private eventEmitter: EventEmitter2,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const controller = context.getClass();

    // Retrieve metadata from handler or controller
    const auditMeta = this.reflector.getAllAndOverride<AuditMetadata>(
      AUDIT_METADATA_KEY,
      [handler, controller],
    );

    if (!auditMeta) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const user = request.user; // Set by JwtAuthGuard
    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Trigger asynchronous audit log event
          // Extract targetId if possible from route params or response data
          const targetId = request.params?.id || data?.id || null;

          let changes: Record<string, any> | null = null;
          if (
            request.method === 'POST' ||
            request.method === 'PUT' ||
            request.method === 'PATCH'
          ) {
            const body = { ...request.body };
            // Sanitize sensitive information if present
            if (body.password) delete body.password;
            if (body.token) delete body.token;
            changes = body;
          }

          this.eventEmitter.emit('audit.log', {
            userId: user?.id,
            userEmail: user?.email,
            action: auditMeta.action,
            targetId,
            targetType: auditMeta.targetType,
            ipAddress,
            userAgent,
            changes,
          });
        },
      }),
    );
  }
}
