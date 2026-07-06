import { NotFoundException, BadRequestException } from '@nestjs/common';
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
import { OrdersService } from './orders.service';

/**
 * OrdersService Unit Tests
 *
 * Tests cover:
 *   - Order status transitions (valid and invalid)
 *   - findById ownership checks (user vs admin)
 *   - findUserOrders pagination
 *   - Stock restoration on cancellation
 */
describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let paymentsService: any;
  let configService: any;
  let couponsService: any;
  let eventEmitter: any;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      orderItem: { findMany: jest.fn() },
      product: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      cartItem: { deleteMany: jest.fn() },
      address: { findFirst: jest.fn() },
      coupon: { update: jest.fn() },
      $transaction: jest.fn((fn) => fn(prisma)),
    };

    paymentsService = {
      createPaymentOrder: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    couponsService = {
      validateCoupon: jest.fn(),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    const loyaltyService = {
      incrementProgress: jest.fn(),
      decrementProgress: jest.fn(),
    };

    service = new OrdersService(
      prisma,
      paymentsService,
      configService,
      couponsService,
      eventEmitter,
      loyaltyService as any,
    );
  });

  // ─── STATUS TRANSITIONS ──────────────────────────────────────

  describe('updateStatus', () => {
    it('allows PENDING → CONFIRMED transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
      });
      prisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
        items: [],
      });

      const result = await service.updateStatus('order-1', {
        status: 'CONFIRMED' as any,
      });

      expect(result!.status).toBe('CONFIRMED');
    });

    it('allows CONFIRMED → PROCESSING transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
      });
      prisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: 'PROCESSING',
        items: [],
      });

      const result = await service.updateStatus('order-1', {
        status: 'PROCESSING' as any,
      });

      expect(result!.status).toBe('PROCESSING');
    });

    it('rejects invalid transition: DELIVERED → PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'DELIVERED',
      });

      await expect(
        service.updateStatus('order-1', { status: 'PENDING' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid transition: CANCELLED → CONFIRMED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'CANCELLED',
      });

      await expect(
        service.updateStatus('order-1', { status: 'CONFIRMED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid transition: SHIPPED → CANCELLED (no cancel after ship)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'SHIPPED',
      });

      await expect(
        service.updateStatus('order-1', { status: 'CANCELLED' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('nonexistent', { status: 'CONFIRMED' as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it('restores stock when cancelling an order', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce({
          id: 'order-1',
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          id: 'order-1',
          status: 'CANCELLED',
          items: [],
        });
      prisma.orderItem.findMany.mockResolvedValue([
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ]);
      prisma.product.update.mockResolvedValue({});
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('order-1', { status: 'CANCELLED' as any });

      // Verify stock was restored for both products
      expect(prisma.product.update).toHaveBeenCalledTimes(2);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: { increment: 2 } },
      });
    });
  });

  // ─── findById ────────────────────────────────────────────────

  describe('findById', () => {
    it('returns order when user is the owner', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        items: [],
        payments: [],
      });

      const result = await service.findById('order-1', {
        id: 'user-1',
        role: 'USER',
      });

      expect(result.id).toBe('order-1');
    });

    it('returns order for ADMIN regardless of ownership', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-2',
        items: [],
        payments: [],
      });

      const result = await service.findById('order-1', {
        id: 'admin-1',
        role: 'ADMIN',
      });

      expect(result.id).toBe('order-1');
    });

    it('throws NotFoundException when non-owner user tries to access', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-2', // Different user
        items: [],
        payments: [],
      });

      await expect(
        service.findById('order-1', { id: 'user-1', role: 'USER' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findById('nonexistent', { id: 'user-1', role: 'USER' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findUserOrders ──────────────────────────────────────────

  describe('findUserOrders', () => {
    it('returns paginated orders for a user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.order.findMany.mockResolvedValue([
        { id: 'order-1', status: 'DELIVERED' },
      ]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.findUserOrders('auth-1', 1, 10);

      expect(result.orders).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('throws NotFoundException for unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findUserOrders('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('caps pagination limit at 50', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.order.findMany.mockResolvedValue([]);
      prisma.order.count.mockResolvedValue(0);

      await service.findUserOrders('auth-1', 1, 200);

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Capped from 200
        }),
      );
    });
  });
});
