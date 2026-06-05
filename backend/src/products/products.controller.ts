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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/products.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of products returned successfully.' })
  @UseInterceptors(CacheInterceptor)
  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @UseInterceptors(CacheInterceptor)
  @Get('featured')
  getFeatured() {
    return this.productsService.getFeatured();
  }

  @UseInterceptors(CacheInterceptor)
  @Get('bestsellers')
  getBestsellers() {
    return this.productsService.getBestsellers();
  }

  @UseInterceptors(CacheInterceptor)
  @Get('new-arrivals')
  getNewArrivals() {
    return this.productsService.getNewArrivals();
  }

  @UseInterceptors(CacheInterceptor)
  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

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
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete products (Admin)' })
  @ApiResponse({ status: 200, description: 'Products deleted successfully.' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  bulkDelete(@Body('ids') ids: string[]) {
    return this.productsService.bulkDelete(ids);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
