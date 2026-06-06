import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes — categories change very rarely
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
