import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaimRewardDto, AdminUpdateProgressDto } from './dto/loyalty.dto';
import { v4 as uuidv4 } from 'uuid';

/** Maximum product price eligible for loyalty reward (in INR) */
const MAX_REWARD_PRICE = 999;

/** Motivational messages keyed by remaining orders */
const MOTIVATION_MESSAGES: Record<number, string> = {
  10: '🎉 Your Loyalty Journey has started!',
  9: '⭐ Only 9 more orders to unlock your FREE T-Shirt.',
  8: '🔥 Amazing! Keep collecting Fan Stamps.',
  7: '🔥 Amazing! Keep collecting Fan Stamps.',
  6: '🔥 Amazing! Keep collecting Fan Stamps.',
  5: "💪 You're halfway there.",
  4: "💪 You're halfway there.",
  3: '🚀 Just 3 more orders remaining.',
  2: '🚀 Just 2 more orders remaining.',
  1: '❤️ One final order to unlock your reward!',
  0: '🎁 Congratulations! Your FREE T-Shirt is ready to claim.',
};

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create loyalty progress for a user.
   * Returns current progress with motivation message.
   */
  async getProgress(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    let progress = await this.prisma.loyaltyProgress.findUnique({
      where: { userId },
      include: {
        rewards: {
          orderBy: { claimedAt: 'desc' },
          take: 5,
        },
        countedOrders: {
          orderBy: { countedAt: 'desc' },
          take: 10,
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                totalAmount: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    // Auto-create progress record on first access
    if (!progress) {
      progress = await this.prisma.loyaltyProgress.create({
        data: {
          userId,
          email: user.email,
        },
        include: {
          rewards: true,
          countedOrders: {
            include: {
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  totalAmount: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      });
    }

    const remaining = Math.max(
      0,
      progress.requiredOrders - progress.completedOrders,
    );
    const percentage = Math.round(
      (progress.completedOrders / progress.requiredOrders) * 100,
    );

    return {
      ...progress,
      remainingOrders: remaining,
      progressPercentage: percentage,
      motivationMessage:
        MOTIVATION_MESSAGES[remaining] || MOTIVATION_MESSAGES[10],
    };
  }

  /**
   * Increment loyalty progress when an order is DELIVERED.
   * Called from OrdersService.updateStatus().
   *
   * Security:
   * - Validates order exists and belongs to the user
   * - Checks order status is DELIVERED
   * - LoyaltyCountedOrder unique constraint prevents duplicates
   * - Transaction ensures atomicity
   */
  async incrementProgress(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true },
      });

      if (!order || order.status !== 'DELIVERED') {
        return; // Silently ignore non-DELIVERED orders
      }

      const user = await this.prisma.user.findUnique({
        where: { id: order.userId },
      });
      if (!user) return;

      await this.prisma.$transaction(async (tx) => {
        // Get or create loyalty progress
        let progress = await tx.loyaltyProgress.findUnique({
          where: { userId: order.userId },
        });

        if (!progress) {
          progress = await tx.loyaltyProgress.create({
            data: {
              userId: order.userId,
              email: user.email,
            },
          });
        }

        // If reward already unlocked (10/10), don't increment further
        if (progress.rewardUnlocked && !progress.rewardClaimed) {
          return;
        }

        // Try to create counted order record — unique constraint prevents duplicates
        try {
          await tx.loyaltyCountedOrder.create({
            data: {
              loyaltyProgressId: progress.id,
              orderId: order.id,
              cycle: progress.currentCycle,
            },
          });
        } catch (err: any) {
          // Unique constraint violation = already counted, exit silently
          if (err?.code === 'P2002') {
            return;
          }
          throw err;
        }

        const newCompleted = progress.completedOrders + 1;
        const rewardUnlocked = newCompleted >= progress.requiredOrders;

        await tx.loyaltyProgress.update({
          where: { id: progress.id },
          data: {
            completedOrders: newCompleted,
            rewardUnlocked,
            lastOrderId: order.id,
          },
        });
      });

      this.logger.log(
        `Loyalty stamp awarded for order ${orderId} (user: ${order.userId})`,
      );
    } catch (err) {
      // Don't let loyalty errors break the order flow
      this.logger.error(
        `Failed to increment loyalty for order ${orderId}:`,
        err,
      );
    }
  }

  /**
   * Decrement loyalty progress when a previously DELIVERED order is
   * CANCELLED or REFUNDED. Only reverses if the order was actually counted.
   */
  async decrementProgress(orderId: string): Promise<void> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true },
      });
      if (!order) return;

      const progress = await this.prisma.loyaltyProgress.findUnique({
        where: { userId: order.userId },
      });
      if (!progress) return;

      // Check if this order was actually counted
      const countedOrder = await this.prisma.loyaltyCountedOrder.findUnique({
        where: {
          loyaltyProgressId_orderId: {
            loyaltyProgressId: progress.id,
            orderId: order.id,
          },
        },
      });

      if (!countedOrder) return; // Order was never counted, nothing to reverse

      // Only reverse if the order was counted in the current cycle
      if (countedOrder.cycle !== progress.currentCycle) return;

      // Don't reverse if reward has already been claimed in this cycle
      if (progress.rewardClaimed) return;

      await this.prisma.$transaction(async (tx) => {
        await tx.loyaltyCountedOrder.delete({
          where: { id: countedOrder.id },
        });

        const newCompleted = Math.max(0, progress.completedOrders - 1);
        await tx.loyaltyProgress.update({
          where: { id: progress.id },
          data: {
            completedOrders: newCompleted,
            rewardUnlocked: newCompleted >= progress.requiredOrders,
          },
        });
      });

      this.logger.log(
        `Loyalty stamp reversed for order ${orderId} (user: ${order.userId})`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to decrement loyalty for order ${orderId}:`,
        err,
      );
    }
  }

  /**
   * Fetch products eligible for loyalty reward.
   * Enforces: loyaltyEligible = true AND price <= 999 AND isActive = true.
   */
  async getEligibleProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        loyaltyEligible: true,
        isActive: true,
        price: { lte: MAX_REWARD_PRICE },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        sizes: true,
        colors: true,
        stock: true,
      },
      orderBy: { price: 'asc' },
    });

    return products;
  }

  /**
   * Claim the loyalty reward. Creates a 100% discount coupon for the selected
   * product and starts a new loyalty cycle.
   *
   * Security:
   * - Re-validates product price from DB (never trusts frontend)
   * - Checks rewardUnlocked = true AND rewardClaimed = false
   * - Transaction-wrapped for atomicity
   * - Unique coupon code prevents collisions
   */
  async claimReward(userId: string, dto: ClaimRewardDto) {
    const progress = await this.prisma.loyaltyProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      throw new NotFoundException('Loyalty progress not found');
    }

    if (!progress.rewardUnlocked) {
      throw new BadRequestException(
        'Reward has not been unlocked yet. Complete 10 orders first.',
      );
    }

    if (progress.rewardClaimed) {
      throw new ConflictException(
        'Reward has already been claimed for this cycle.',
      );
    }

    // Fetch product and re-validate price server-side
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is no longer available.');
    }

    if (!product.loyaltyEligible) {
      throw new BadRequestException(
        'This product is not eligible for loyalty rewards.',
      );
    }

    if (Number(product.price) > MAX_REWARD_PRICE) {
      throw new BadRequestException(
        `Product price ₹${product.price} exceeds the maximum reward limit of ₹${MAX_REWARD_PRICE}.`,
      );
    }

    // Validate size/color if provided
    if (
      dto.size &&
      product.sizes.length > 0 &&
      !product.sizes.includes(dto.size)
    ) {
      throw new BadRequestException(
        `Size "${dto.size}" is not available for this product.`,
      );
    }
    if (
      dto.color &&
      product.colors.length > 0 &&
      !product.colors.includes(dto.color)
    ) {
      throw new BadRequestException(
        `Color "${dto.color}" is not available for this product.`,
      );
    }

    // Generate unique coupon code
    const couponCode = `LOYALTY-${progress.currentCycle}-${uuidv4().slice(0, 8).toUpperCase()}`;

    const result = await this.prisma.$transaction(async (tx) => {
      // Create 100% discount coupon for the exact product price
      const coupon = await tx.coupon.create({
        data: {
          code: couponCode,
          discountType: 'FIXED',
          value: product.price,
          minCartAmount: null,
          maxDiscount: product.price,
          usageLimit: 1,
          usedCount: 0,
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
        },
      });

      // Record the reward
      const reward = await tx.loyaltyReward.create({
        data: {
          loyaltyProgressId: progress.id,
          cycle: progress.currentCycle,
          productId: product.id,
          productName: product.name,
          productImage: product.images?.[0] || null,
          productSize: dto.size || null,
          productColor: dto.color || null,
          couponId: coupon.id,
          couponCode: coupon.code,
        },
      });

      // Step 1: Mark reward as claimed and increment lifetime rewards
      await tx.loyaltyProgress.update({
        where: { id: progress.id },
        data: {
          rewardClaimed: true,
          lifetimeRewards: { increment: 1 },
        },
      });

      // Step 2: Start new cycle — reset stamps and flags
      await tx.loyaltyProgress.update({
        where: { id: progress.id },
        data: {
          currentCycle: { increment: 1 },
          completedOrders: 0,
          rewardUnlocked: false,
          rewardClaimed: false,
          lastOrderId: null,
        },
      });

      return { reward, coupon };
    });

    this.logger.log(
      `Loyalty reward claimed by user ${userId}: product="${product.name}", coupon="${couponCode}", cycle=${progress.currentCycle}`,
    );

    return {
      success: true,
      reward: result.reward,
      couponCode: result.coupon.code,
      message: `🎉 Congratulations! Your FREE ${product.name} coupon has been generated. Use code ${result.coupon.code} at checkout.`,
    };
  }

  /**
   * Get complete reward history for a user.
   */
  async getRewardHistory(userId: string) {
    const progress = await this.prisma.loyaltyProgress.findUnique({
      where: { userId },
    });
    if (!progress) return { rewards: [], lifetimeRewards: 0 };

    const rewards = await this.prisma.loyaltyReward.findMany({
      where: { loyaltyProgressId: progress.id },
      orderBy: { claimedAt: 'desc' },
    });

    return {
      rewards,
      lifetimeRewards: progress.lifetimeRewards,
    };
  }

  // ── Admin Methods ──

  async adminGetAllProgress(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [progress, total] = await Promise.all([
      this.prisma.loyaltyProgress.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          rewards: { orderBy: { claimedAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyProgress.count({ where }),
    ]);

    return {
      progress: progress.map((p) => ({
        ...p,
        remainingOrders: Math.max(0, p.requiredOrders - p.completedOrders),
        progressPercentage: Math.round(
          (p.completedOrders / p.requiredOrders) * 100,
        ),
        status: p.rewardClaimed
          ? 'CLAIMED'
          : p.rewardUnlocked
            ? 'REWARD_READY'
            : 'IN_PROGRESS',
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async adminUpdateProgress(userId: string, dto: AdminUpdateProgressDto) {
    const progress = await this.prisma.loyaltyProgress.findUnique({
      where: { userId },
    });
    if (!progress) {
      throw new NotFoundException('Loyalty progress not found for this user');
    }

    const data: any = {};
    if (dto.completedOrders !== undefined) {
      data.completedOrders = dto.completedOrders;
      data.rewardUnlocked = dto.completedOrders >= progress.requiredOrders;
    }
    if (dto.currentCycle !== undefined) data.currentCycle = dto.currentCycle;
    if (dto.rewardUnlocked !== undefined)
      data.rewardUnlocked = dto.rewardUnlocked;
    if (dto.rewardClaimed !== undefined) data.rewardClaimed = dto.rewardClaimed;

    return this.prisma.loyaltyProgress.update({
      where: { userId },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async adminResetCycle(userId: string) {
    const progress = await this.prisma.loyaltyProgress.findUnique({
      where: { userId },
    });
    if (!progress) {
      throw new NotFoundException('Loyalty progress not found for this user');
    }

    return this.prisma.loyaltyProgress.update({
      where: { userId },
      data: {
        completedOrders: 0,
        rewardUnlocked: false,
        rewardClaimed: false,
        lastOrderId: null,
        currentCycle: { increment: 1 },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async adminGetAnalytics() {
    const [
      totalUsers,
      totalRewardsClaimed,
      usersWithProgress,
      rewardReadyCount,
    ] = await Promise.all([
      this.prisma.loyaltyProgress.count(),
      this.prisma.loyaltyReward.count(),
      this.prisma.loyaltyProgress.findMany({
        select: { completedOrders: true, requiredOrders: true },
      }),
      this.prisma.loyaltyProgress.count({
        where: { rewardUnlocked: true, rewardClaimed: false },
      }),
    ]);

    const nearCompletion = usersWithProgress.filter(
      (p) => p.completedOrders >= 7 && p.completedOrders < p.requiredOrders,
    ).length;

    const avgProgress =
      usersWithProgress.length > 0
        ? Math.round(
            usersWithProgress.reduce(
              (sum, p) => sum + (p.completedOrders / p.requiredOrders) * 100,
              0,
            ) / usersWithProgress.length,
          )
        : 0;

    // Recent rewards (last 10)
    const recentRewards = await this.prisma.loyaltyReward.findMany({
      orderBy: { claimedAt: 'desc' },
      take: 10,
      include: {
        loyaltyProgress: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return {
      totalUsers,
      totalRewardsClaimed,
      rewardReadyCount,
      nearCompletion,
      avgProgress,
      recentRewards: recentRewards.map((r) => ({
        id: r.id,
        userName: r.loyaltyProgress.user.name,
        userEmail: r.loyaltyProgress.user.email,
        productName: r.productName,
        cycle: r.cycle,
        claimedAt: r.claimedAt,
        couponCode: r.couponCode,
      })),
    };
  }
}
