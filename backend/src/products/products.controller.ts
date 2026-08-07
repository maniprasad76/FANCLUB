import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { SkipThrottle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  BulkDeleteDto,
} from './dto/products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';
import { Audit } from '../audit/decorators/audit.decorator.js';

@SkipThrottle()
@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of products returned successfully.',
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes — featured products change rarely
  @Get('featured')
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get('bestsellers')
  getBestsellers() {
    return this.productsService.getBestsellers();
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000) // 10 minutes
  @Get('new-arrivals')
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @SkipThrottle()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @SkipThrottle()
  @Get('slug/:slug/related')
  getRelated(@Param('slug') slug: string) {
    return this.productsService.getRelated(slug);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  adminFindAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.productsService.adminFindAll(+page, +limit, search);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Admin)' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('CREATE_PRODUCT', 'PRODUCT')
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete products (Admin)' })
  @ApiResponse({ status: 200, description: 'Products deleted successfully.' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('BULK_DELETE_PRODUCTS', 'PRODUCT')
  @Post('bulk-delete')
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.productsService.bulkDelete(dto.ids);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('UPDATE_PRODUCT', 'PRODUCT')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(CacheInvalidationInterceptor)
  @Audit('DELETE_PRODUCT', 'PRODUCT')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
