import { NotFoundException } from '@nestjs/common';
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
    };

    service = new OrdersService(prisma, {} as any);
  });

  it('allows users to read their own order', async () => {
    const order = {
      id: 'order-1',
      userId: 'user-1',
      items: [],
      payments: [],
    };
    prisma.order.findUnique.mockResolvedValue(order);

    await expect(
      service.findById('order-1', { id: 'user-1', role: 'USER' }),
    ).resolves.toBe(order);
  });

  it('hides another user order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'user-2',
    });

    await expect(
      service.findById('order-1', { id: 'user-1', role: 'USER' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('allows admins to read any order', async () => {
    const order = { id: 'order-1', userId: 'user-2' };
    prisma.order.findUnique.mockResolvedValue(order);

    await expect(
      service.findById('order-1', { id: 'admin-1', role: 'ADMIN' }),
    ).resolves.toBe(order);
  });
});
