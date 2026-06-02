import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) };
  }

  async findByAuthId(authId: string) {
    const user = await this.prisma.user.findUnique({
      where: { authId },
      include: { addresses: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(authId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ where: { authId }, data: dto });
  }

  async addAddress(authId: string, dto: CreateAddressDto) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { ...dto, userId: user.id } });
  }

  async updateAddress(
    authId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    const result = await this.prisma.address.updateMany({
      where: { id: addressId, userId: user.id },
      data: dto,
    });

    if (result.count === 0) throw new NotFoundException('Address not found');

    return this.prisma.address.findUnique({ where: { id: addressId } });
  }

  async deleteAddress(authId: string, addressId: string) {
    const user = await this.prisma.user.findUnique({ where: { authId } });
    if (!user) throw new NotFoundException('User not found');

    const result = await this.prisma.address.deleteMany({
      where: { id: addressId, userId: user.id },
    });

    if (result.count === 0) throw new NotFoundException('Address not found');

    return { deleted: true };
  }
}
