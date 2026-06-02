#!/usr/bin/env node
/**
 * TFI NestJS Module Scaffolder
 * 
 * Usage: node scaffold-module.js feature-name
 * 
 * Creates the following files in backend/src/feature-name/:
 *   ├── feature-name.module.ts
 *   ├── feature-name.controller.ts
 *   ├── feature-name.service.ts
 *   └── dto/
 *       ├── create-feature-name.dto.ts
 *       └── update-feature-name.dto.ts
 */

const fs = require('fs');
const path = require('path');

const rawName = process.argv[2];
if (!rawName) {
  console.error('Usage: node scaffold-module.js <feature-name>');
  console.error('Example: node scaffold-module.js coupons');
  process.exit(1);
}

// Naming conversions
const kebab = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-');
const pascal = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

const backendSrc = path.join(__dirname, '..', '..', '..', 'backend', 'src');
const moduleDir = path.join(backendSrc, kebab);
const dtoDir = path.join(moduleDir, 'dto');

fs.mkdirSync(dtoDir, { recursive: true });

// ── Create DTO ──
const createDto = `import { IsString, IsOptional, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Create${pascal}Dto {
  @ApiProperty({ description: '${pascal} name', example: 'New ${pascal}' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;
}
`;

// ── Update DTO ──
const updateDto = `import { PartialType } from '@nestjs/swagger';
import { Create${pascal}Dto } from './create-${kebab}.dto';

export class Update${pascal}Dto extends PartialType(Create${pascal}Dto) {}
`;

// ── Service ──
const service = `import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';

@Injectable()
export class ${pascal}Service {
  private readonly logger = new Logger(${pascal}Service.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: Create${pascal}Dto) {
    return this.prisma.${camel}.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.${camel}.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.${camel}.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.${camel}.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('${pascal} not found');
    return item;
  }

  async update(id: string, dto: Update${pascal}Dto) {
    await this.findOne(id);
    return this.prisma.${camel}.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.${camel}.delete({ where: { id } });
  }
}
`;

// ── Controller ──
const controller = `import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ${pascal}Service } from './${kebab}.service';
import { Create${pascal}Dto } from './dto/create-${kebab}.dto';
import { Update${pascal}Dto } from './dto/update-${kebab}.dto';

@ApiTags('${pascal}')
@Controller('${kebab}')
export class ${pascal}Controller {
  constructor(private readonly ${camel}Service: ${pascal}Service) {}

  @Get()
  @ApiOperation({ summary: 'List all ${camel}s' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.${camel}Service.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${camel} by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.${camel}Service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create ${camel} (Admin)' })
  create(@Body() dto: Create${pascal}Dto) {
    return this.${camel}Service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ${camel} (Admin)' })
  update(@Param('id') id: string, @Body() dto: Update${pascal}Dto) {
    return this.${camel}Service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete ${camel} (Admin)' })
  remove(@Param('id') id: string) {
    return this.${camel}Service.remove(id);
  }
}
`;

// ── Module ──
const module = `import { Module } from '@nestjs/common';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
  exports: [${pascal}Service],
})
export class ${pascal}Module {}
`;

// Write files
fs.writeFileSync(path.join(dtoDir, `create-${kebab}.dto.ts`), createDto);
fs.writeFileSync(path.join(dtoDir, `update-${kebab}.dto.ts`), updateDto);
fs.writeFileSync(path.join(moduleDir, `${kebab}.service.ts`), service);
fs.writeFileSync(path.join(moduleDir, `${kebab}.controller.ts`), controller);
fs.writeFileSync(path.join(moduleDir, `${kebab}.module.ts`), module);

console.log(`✅ Created NestJS module: ${moduleDir}/`);
console.log(`   ├── ${kebab}.module.ts`);
console.log(`   ├── ${kebab}.controller.ts`);
console.log(`   ├── ${kebab}.service.ts`);
console.log(`   └── dto/`);
console.log(`       ├── create-${kebab}.dto.ts`);
console.log(`       └── update-${kebab}.dto.ts`);
console.log(`\n📝 Don't forget to:`);
console.log(`   1. Add the Prisma model to schema.prisma`);
console.log(`   2. Run: npx prisma generate`);
console.log(`   3. Register in app.module.ts:`);
console.log(`      import { ${pascal}Module } from './${kebab}/${kebab}.module.js';`);
console.log(`      // Add to imports: ${pascal}Module`);
