import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting Prisma to PostgreSQL database pool...');
    await this.$connect();
    this.logger.log('✅ Prisma connected successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting Prisma from PostgreSQL database pool (graceful shutdown)...');
    await this.$disconnect();
    this.logger.log('✅ Prisma disconnected successfully.');
  }
}
