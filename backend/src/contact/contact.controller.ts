import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  /** 3 submissions per minute — spam protection */
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto.name, dto.email, dto.subject, dto.message);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.contactService.findAll(+page, +limit);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id/read')
  markRead(@Param('id') id: string) {
    return this.contactService.markRead(id);
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.contactService.delete(id);
  }
}
