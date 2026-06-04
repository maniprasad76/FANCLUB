import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global exception filter that catches ALL unhandled errors.
 *
 * - HttpExceptions: formatted into a standard API response.
 * - Unknown errors: logged with stack trace, but the response body
 *   hides internal details in production to prevent information leaks.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId || '-';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string | string[]) || exception.message;
        error = (resp.error as string) || exception.name;
      }

      // Provide a helpful message for rate-limited requests
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        message =
          'Too many requests. Please wait a moment before trying again.';
      }

      // Log client errors (4xx) at warn level, server errors (5xx) at error level
      if (status >= 500) {
        this.logger.error(
          `[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)} [${requestId}]`,
          exception.stack,
        );
      } else {
        this.logger.warn(
          `[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)} [${requestId}]`,
        );
      }
    } else if (exception instanceof Error) {
      // Unhandled exception — always log the full details server-side
      this.logger.error(
        `[${request.method}] ${request.url} → Unhandled: ${exception.message} [${requestId}]`,
        exception.stack,
      );

      // In production, hide the real error message from the client
      if (this.isProduction) {
        message = 'An unexpected error occurred. Please try again later.';
      } else {
        message = exception.message;
      }
    } else {
      // Non-Error thrown (string, number, etc.) — very unusual
      this.logger.error(
        `[${request.method}] ${request.url} → Non-Error thrown: ${String(exception)} [${requestId}]`,
      );

      if (this.isProduction) {
        message = 'An unexpected error occurred. Please try again later.';
      } else {
        message = String(exception);
      }
    }

    const body: Record<string, unknown> = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // In development, include the stack trace for debugging convenience
    if (!this.isProduction && exception instanceof Error) {
      body.stack = exception.stack;
    }

    response.status(status).json(body);
  }
}
