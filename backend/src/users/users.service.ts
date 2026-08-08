import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserDto,
  CreateAddressDto,
  UpdateAddressDto,
} from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async resolveUser(userIdentifier?: string) {
    if (!userIdentifier) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: userIdentifier }, { authId: userIdentifier }],
      },
      include: { addresses: true },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll(page = 1, limit = 20) {
    const safeLimit = Math.min(100, Math.max(1, limit));
    const safePage = Math.max(1, page);
    const skip = (safePage - 1) * safeLimit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return {
      users,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    };
  }

  async findByAuthId(userIdentifier: string) {
    return this.resolveUser(userIdentifier);
  }

  async findById(id: string) {
    if (!id) throw new NotFoundException('User ID missing');
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

  async update(userIdentifier: string, dto: UpdateUserDto) {
    const user = await this.resolveUser(userIdentifier);
    return this.prisma.user.update({ where: { id: user.id }, data: dto });
  }

  async addAddress(userIdentifier: string, dto: CreateAddressDto) {
    const user = await this.resolveUser(userIdentifier);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { ...dto, userId: user.id } });
  }

  async updateAddress(
    userIdentifier: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const user = await this.resolveUser(userIdentifier);

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

  async deleteAddress(userIdentifier: string, addressId: string) {
    const user = await this.resolveUser(userIdentifier);

    const result = await this.prisma.address.deleteMany({
      where: { id: addressId, userId: user.id },
    });

    if (result.count === 0) throw new NotFoundException('Address not found');

    return { deleted: true };
  }
}
