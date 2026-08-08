import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      address: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new UsersService(prisma);
  });

  it('updates only addresses owned by the current user', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.address.updateMany.mockResolvedValue({ count: 1 });
    prisma.address.findUnique.mockResolvedValue({
      id: 'addr-1',
      userId: 'user-1',
    });

    await service.updateAddress('auth-1', 'addr-1', { city: 'Mumbai' });

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { id: 'addr-1', userId: 'user-1' },
      data: { city: 'Mumbai' },
    });
  });

  it('does not update another user address', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.address.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.updateAddress('auth-1', 'addr-2', { city: 'Delhi' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletes only addresses owned by the current user', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prisma.address.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.deleteAddress('auth-1', 'addr-1')).resolves.toEqual({
      deleted: true,
    });

    expect(prisma.address.deleteMany).toHaveBeenCalledWith({
      where: { id: 'addr-1', userId: 'user-1' },
    });
  });
});
