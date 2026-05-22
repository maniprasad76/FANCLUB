import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, email: string, subject: string, message: string) {
    return this.prisma.contact.create({
      data: { name, email, subject, message },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
      this.prisma.contact.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contact.count(),
    ]);
    return { messages, total, page, pages: Math.ceil(total / limit) };
  }

  async markRead(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Message not found');
    return this.prisma.contact.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async delete(id: string) {
    await this.prisma.contact.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
