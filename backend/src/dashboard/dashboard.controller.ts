import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120000) // 2 minutes (120,000 ms)
  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }
}
