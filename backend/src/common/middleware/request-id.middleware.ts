import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * RequestIdMiddleware — Generates a unique request ID for every incoming request.
 *
 * - Attaches `req.requestId` for use by downstream services, guards, and interceptors
 * - Sets `X-Request-Id` response header for client-side log correlation
 * - Accepts an incoming `X-Request-Id` header from API gateways / load balancers
 *   to maintain distributed tracing continuity
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(
    req: Request & { requestId?: string },
    res: Response,
    next: NextFunction,
  ): void {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to the request object for downstream usage
    req.requestId = requestId;

    // Set on response headers so the frontend can correlate logs
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
