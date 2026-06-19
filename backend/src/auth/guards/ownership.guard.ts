import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * OwnershipGuard — Zero-Trust Resource Ownership Verification
 *
 * Verifies that the authenticated user owns the resource they are
 * trying to access. Admins bypass ownership checks.
 *
 * SECURITY DESIGN:
 * - Fails CLOSED on all error paths (denies access)
 * - Returns 404 (not 403) for non-owner access to prevent resource enumeration
 * - Emits audit events for unauthorized access attempts
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @CheckOwnership('order')           // model name
 *   @Get(':id')
 *   getOrder(@Param('id') id: string) { ... }
 *
 *   // Custom param key (when the param is not `:id`):
 *   @CheckOwnership('order', 'orderId')
 *   @Get(':orderId/details')
 *   getOrderDetails(@Param('orderId') orderId: string) { ... }
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admins bypass ownership checks
    if (user?.role === 'ADMIN') {
      return true;
    }

    const modelName = this.reflector.get<string>(
      'ownership_model',
      context.getHandler(),
    );

    // If no ownership_model metadata is set, skip the check
    if (!modelName) {
      return true;
    }

    // Determine which param holds the resource ID
    const paramKey =
      this.reflector.get<string>('ownership_param', context.getHandler()) ||
      'id';
    const resourceId = request.params?.[paramKey];

    if (!resourceId) {
      return true; // No resource ID in params — skip
    }

    try {
      // Dynamically access the Prisma model
      const model = (this.prisma as any)[modelName];
      if (!model) {
        this.logger.error(
          `OwnershipGuard: Unknown Prisma model "${modelName}" — DENYING ACCESS. Fix @CheckOwnership() metadata.`,
        );
        // FAIL CLOSED — deny access on misconfiguration
        throw new InternalServerErrorException(
          'Authorization configuration error',
        );
      }

      const resource = await model.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      if (resource.userId !== user?.id) {
        // Log the unauthorized access attempt
        this.logger.warn(
          `🚫 IDOR attempt blocked — user=${user?.id} tried to access ${modelName}=${resourceId} owned by ${resource.userId} → ${request.method} ${request.url}`,
        );

        // Emit audit event for security monitoring
        this.eventEmitter.emit('audit.log', {
          userId: user?.id,
          userEmail: user?.email,
          action: 'OWNERSHIP_VIOLATION',
          targetId: resourceId,
          targetType: modelName.toUpperCase(),
          ipAddress:
            request.ip || request.headers['x-forwarded-for'] || 'unknown',
          userAgent: request.headers['user-agent'] || 'unknown',
          changes: {
            attemptedResource: `${modelName}:${resourceId}`,
            resourceOwner: resource.userId,
            httpMethod: request.method,
            url: request.url,
          },
        });

        // Return 404 — prevents resource enumeration (IDOR defense)
        throw new NotFoundException('Resource not found');
      }

      return true;
    } catch (error) {
      // Re-throw known HTTP exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // FAIL CLOSED — deny access on unexpected errors
      this.logger.error(
        `OwnershipGuard unexpected error — DENYING ACCESS: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new NotFoundException('Resource not found');
    }
  }
}
