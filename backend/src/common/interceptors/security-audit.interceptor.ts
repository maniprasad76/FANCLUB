import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request } from 'express';

/**
 * SecurityAuditInterceptor — Logs all authorization failures to the AuditLog.
 *
 * Intercepts HTTP responses and detects:
 * - 401 Unauthorized → unauthenticated access attempts
 * - 403 Forbidden    → insufficient permissions
 * - 404 from ownership checks → potential IDOR attempts (logged by OwnershipGuard directly)
 *
 * This interceptor captures the error, emits an audit event, then re-throws
 * so the normal exception filter handles the response.
 *
 * Sensitive fields (passwords, tokens) are stripped from logged payloads.
 */

const SENSITIVE_FIELDS = new Set([
  'password',
  'access_token',
  'refresh_token',
  'token',
  'secret',
  'authorization',
  'cookie',
  'signature',
  'razorpay_signature',
]);

function sanitizePayload(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizePayload);

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

@Injectable()
export class SecurityAuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SecurityAuditInterceptor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: any) => {
        const status = error?.getStatus?.() || error?.status || 500;

        // Only log security-relevant errors (401, 403)
        if (status === 401 || status === 403) {
          try {
            const request = context
              .switchToHttp()
              .getRequest<Request & { user?: any; requestId?: string }>();

            const action =
              status === 401
                ? 'UNAUTHORIZED_ACCESS_ATTEMPT'
                : 'FORBIDDEN_ACCESS_ATTEMPT';

            this.eventEmitter.emit('audit.log', {
              userId: request.user?.id || null,
              userEmail: request.user?.email || null,
              action,
              targetId: request.params?.id || null,
              targetType: 'API_ENDPOINT',
              ipAddress:
                request.ip ||
                request.headers['x-forwarded-for'] ||
                'unknown',
              userAgent: request.headers['user-agent'] || 'unknown',
              changes: {
                method: request.method,
                url: request.url,
                statusCode: status,
                errorMessage:
                  typeof error.getResponse?.() === 'string'
                    ? error.getResponse()
                    : error.getResponse?.()?.message || error.message,
                requestId: request.requestId || null,
                body: sanitizePayload(request.body),
              },
            });

            this.logger.warn(
              `🔒 Security event [${action}] — user=${request.user?.id || 'anonymous'} → ${request.method} ${request.url} [${status}]`,
            );
          } catch (logError) {
            // Never let audit logging break the request pipeline
            this.logger.error(
              `Failed to log security event: ${(logError as Error).message}`,
            );
          }
        }

        return throwError(() => error);
      }),
    );
  }
}
