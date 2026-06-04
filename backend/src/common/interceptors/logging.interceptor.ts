import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();
    const { method, url } = request;
    const requestId = request.requestId || '-';
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url} [${requestId}]`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;
          const contentLength = response.getHeader('content-length') || '-';
          this.logger.log(
            `← ${method} ${url} ${response.statusCode} ${duration}ms ${contentLength}b [${requestId}]`,
          );
        },
        error: (err: Error & { status?: number }) => {
          const duration = Date.now() - startTime;
          const status = err.status || 500;
          this.logger.warn(
            `← ${method} ${url} ${status} ${duration}ms | ${err.message} [${requestId}]`,
          );
        },
      }),
    );
  }
}
