import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit.dto';
import { Prisma } from '@prisma/client';

export interface AuditLogEvent {
  userId?: string;
  userEmail?: string;
  action: string;
  targetId?: string;
  targetType?: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(event: AuditLogEvent) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: event.userId || null,
          userEmail: event.userEmail || null,
          action: event.action,
          targetId: event.targetId || null,
          targetType: event.targetType || null,
          ipAddress: event.ipAddress || null,
          userAgent: event.userAgent || null,
          changes: event.changes
            ? (event.changes as Prisma.InputJsonValue)
            : Prisma.DbNull,
        },
      });
      this.logger.debug(
        `Audit log successfully saved for action: ${event.action}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to save audit log: ${(err as Error).message}`,
        (err as Error).stack,
      );
    }
  }

  async findAll(query: AuditLogQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.action) {
      where.action = query.action;
    }
    if (query.targetType) {
      where.targetType = query.targetType;
    }
    if (query.userEmail) {
      where.userEmail = { contains: query.userEmail, mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { action: { contains: query.search, mode: 'insensitive' } },
        { targetType: { contains: query.search, mode: 'insensitive' } },
        { userEmail: { contains: query.search, mode: 'insensitive' } },
        { targetId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }
}
