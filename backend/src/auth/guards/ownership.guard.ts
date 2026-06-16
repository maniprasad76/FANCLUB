import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * OWNERSHIP_MODEL metadata key — set via @SetMetadata or a custom decorator.
 * Tells the guard which Prisma model to check ownership against.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @SetMetadata('ownership_model', 'order')
 *   @Get(':id')
 *   getOrder(@Param('id') id: string) { ... }
 *
 * The guard will:
 *   1. Read the model name from metadata
 *   2. Look up the resource by `params.id`
 *   3. Compare `resource.userId` with `req.user.id`
 *   4. Allow admins to bypass ownership checks
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  private readonly logger = new Logger(OwnershipGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
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

    const resourceId = request.params?.id;
    if (!resourceId) {
      return true; // No resource ID in params — skip
    }

    try {
      // Dynamically access the Prisma model
      const model = (this.prisma as any)[modelName];
      if (!model) {
        this.logger.error(
          `OwnershipGuard: Unknown model "${modelName}" — check @SetMetadata('ownership_model', ...)`,
        );
        return true; // Fail open — don't block if misconfigured, log the error
      }

      const resource = await model.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });

      if (!resource) {
        throw new NotFoundException('Resource not found');
      }

      if (resource.userId !== user?.id) {
        this.logger.warn(
          `🚫 Ownership denied — user=${user?.id} attempted to access ${modelName}=${resourceId} owned by ${resource.userId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to access this resource',
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`OwnershipGuard error: ${(error as Error).message}`);
      return true; // Fail open on unexpected errors
    }
  }
}
