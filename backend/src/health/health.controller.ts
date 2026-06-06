import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import os from 'node:os';

import { PrismaService } from '../prisma/prisma.service';

/**
 * Health check endpoints — used by monitoring services and deployment platforms.
 *
 * GET /api/health       — Lightweight liveness probe (no DB call)
 * GET /api/health/ready — Readiness probe with database connectivity check
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — is the process alive? */
  @Get()
  check() {
    return {
      status: 'ok',
      instance: os.hostname(),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  }

  /** Readiness — is the app ready to serve traffic (including DB)? */
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        instance: os.hostname(),
        version: '1.0.0',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        instance: os.hostname(),
        version: '1.0.0',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
      };
    }
  }
}
