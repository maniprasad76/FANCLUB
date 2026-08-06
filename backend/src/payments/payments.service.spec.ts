import { NotFoundException } from '@nestjs/common';
jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
    };

    service = new PaymentsService(
      prisma,
      {} as any,
      { emit: jest.fn() } as any,
      {} as any,
    );
  });

  it('does not create payment orders for another user order', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      userId: 'user-2',
      items: [],
      totalAmount: 1000,
    });

    await expect(
      service.createPaymentOrder('order-1', 'RAZORPAY', 'India', 'INR', {
        id: 'user-1',
        role: 'USER',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
