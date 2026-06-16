import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    const code = dto.code.toUpperCase().trim();

    // Check if code already exists
    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException(`Coupon code '${code}' already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        ...dto,
        code,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coupon.count(),
    ]);

    return { coupons, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id); // Throws if not found

    let code: string | undefined;
    if (dto.code) {
      code = dto.code.toUpperCase().trim();
      const existing = await this.prisma.coupon.findFirst({
        where: { code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Coupon code '${code}' already exists`);
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: {
        ...dto,
        ...(code ? { code } : {}),
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.coupon.delete({
      where: { id },
    });
  }

  async validateCoupon(code: string, cartAmount: number) {
    const formattedCode = code.toUpperCase().trim();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: formattedCode },
    });

    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { valid: false, message: 'Coupon is inactive' };
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, message: 'Coupon campaign has not started yet' };
    }
    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (
      coupon.minCartAmount !== null &&
      cartAmount < Number(coupon.minCartAmount)
    ) {
      return {
        valid: false,
        message: `Minimum purchase of ₹${Number(coupon.minCartAmount).toFixed(2)} required for this coupon`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = (Number(coupon.value) / 100) * cartAmount;
      if (coupon.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Number(coupon.value);
    }

    // Discount cannot exceed cart amount
    discountAmount = Math.min(discountAmount, cartAmount);

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      value: Number(coupon.value),
      discountAmount: Number(discountAmount.toFixed(2)),
    };
  }
}
