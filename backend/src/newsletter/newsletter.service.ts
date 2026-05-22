import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NewsletterService {
  constructor(private prisma: PrismaService) {}

  async subscribe(email: string) {
    try {
      await this.prisma.newsletter.create({ data: { email } });
      return { message: 'Subscribed successfully' };
    } catch {
      throw new ConflictException('Email already subscribed');
    }
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [subscribers, total] = await Promise.all([
      this.prisma.newsletter.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.newsletter.count(),
    ]);
    return { subscribers, total, page, pages: Math.ceil(total / limit) };
  }

  async delete(id: string) {
    await this.prisma.newsletter.delete({ where: { id } });
    return { message: 'Unsubscribed' };
  }
}
