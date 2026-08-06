import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * SettingsService — DB-backed store configuration (CRIT 3).
 *
 * Previously settings were persisted to `data/settings.json`, which is
 * lost on ephemeral filesystems (Cloud Run, Render, Vercel serverless).
 * Now every key/value lives in the `settings` table so it survives
 * redeploys and scales across instances.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string): Promise<any> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? row.value : null;
  }

  async getSettings(): Promise<Record<string, any>> {
    const rows = await this.prisma.setting.findMany();
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: { value: value as Prisma.InputJsonValue },
    });
  }

  async deleteSetting(key: string): Promise<void> {
    await this.prisma.setting.deleteMany({ where: { key } });
  }
}
