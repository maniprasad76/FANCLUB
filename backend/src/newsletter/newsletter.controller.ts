import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { NewsletterService } from './newsletter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private newsletterService: NewsletterService) {}

  /** 3 subscriptions per minute — spam protection */
  @Throttle({ strict: { limit: 3, ttl: 60000 } })
  @Post()
  subscribe(@Body('email') email: string) {
    return this.newsletterService.subscribe(email);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 50) {
    return this.newsletterService.findAll(+page, +limit);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.newsletterService.delete(id);
  }
}
