import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * @CheckOwnership — Declarative resource ownership decorator.
 *
 * Sets the metadata required by OwnershipGuard to verify that the
 * authenticated user owns the resource being accessed.
 *
 * @param model   Prisma model name (lowercase), e.g. 'order', 'review', 'cartItem'
 * @param paramKey  URL param key holding the resource ID (default: 'id')
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, OwnershipGuard)
 *   @CheckOwnership('order')
 *   @Get(':id')
 *   getOrder(@Param('id') id: string) { ... }
 *
 *   // Custom param key:
 *   @CheckOwnership('order', 'orderId')
 *   @Get(':orderId/details')
 *   getOrderDetails(@Param('orderId') orderId: string) { ... }
 */
export const CheckOwnership = (model: string, paramKey: string = 'id') =>
  applyDecorators(
    SetMetadata('ownership_model', model),
    SetMetadata('ownership_param', paramKey),
  );
