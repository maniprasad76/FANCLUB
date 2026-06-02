---
name: nestjs-patterns
description: "NestJS backend development patterns for TFI Club. ACTIVATE when: creating new NestJS modules/controllers/services, writing DTOs with class-validator, adding API endpoints, setting up guards or decorators, configuring Swagger/OpenAPI annotations, injecting PrismaService, handling errors/exceptions, adding rate limiting, working with NestJS interceptors/filters/pipes, or debugging backend TypeScript issues."
metadata:
  author: tfi-team
  version: "1.0.0"
---

# NestJS Patterns — TFI Club Backend

## Module Creation Checklist

When creating a new feature module, create these files in this order:

### 1. DTOs First (`dto/create-feature.dto.ts`)
```typescript
import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeatureDto {
  @ApiProperty({ description: 'Feature name', example: 'New Feature' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Optional description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price in INR', example: 999.99 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status: string;
}
```

**Update DTO pattern:**
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateFeatureDto } from './create-feature.dto';

export class UpdateFeatureDto extends PartialType(CreateFeatureDto) {}
```

### 2. Service (`feature.service.ts`)
```typescript
import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeatureDto) {
    // Check for duplicates if needed
    const existing = await this.prisma.feature.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Feature already exists');
    }

    return this.prisma.feature.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.feature.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.feature.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const item = await this.prisma.feature.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Feature not found');
    return item;
  }

  async update(id: string, dto: UpdateFeatureDto) {
    await this.findOne(id); // Throws if not found
    return this.prisma.feature.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.feature.delete({ where: { id } });
  }
}
```

### 3. Controller (`feature.controller.ts`)
```typescript
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';

@ApiTags('Features')
@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  // ── PUBLIC ENDPOINTS ─────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all features' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.featureService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feature by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.featureService.findOne(id);
  }

  // ── ADMIN ENDPOINTS ─────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create feature (Admin)' })
  create(@Body() dto: CreateFeatureDto) {
    return this.featureService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feature (Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateFeatureDto) {
    return this.featureService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete feature (Admin)' })
  remove(@Param('id') id: string) {
    return this.featureService.remove(id);
  }
}
```

### 4. Module (`feature.module.ts`)
```typescript
import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService], // Export if other modules need it
})
export class FeatureModule {}
```

### 5. Register in AppModule
```typescript
// In app.module.ts — add to imports array:
import { FeatureModule } from './feature/feature.module.js';

@Module({
  imports: [
    // ... existing modules ...
    FeatureModule,
  ],
})
```

> **IMPORTANT:** Use `.js` extension in import paths in `app.module.ts` — this is the project convention for ESM compatibility.

---

## Guard Patterns

### User Authentication (JwtAuthGuard)
```typescript
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
```
- Validates Supabase JWT via `supabase.auth.getUser(token)`
- Looks up user in Prisma by `authId`
- Attaches `{ id, email, name, role, authId }` to `req.user`

### Admin Authorization (AdminGuard)
```typescript
import { AdminGuard } from '../auth/guards/admin.guard';

// ALWAYS pair with JwtAuthGuard — AdminGuard checks req.user.role
@UseGuards(JwtAuthGuard, AdminGuard)
```

### Accessing Current User
```typescript
// In controller method:
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@Req() req: any) {
  const userId = req.user.id;      // Prisma user ID
  const authId = req.user.authId;  // Supabase auth ID
  const role = req.user.role;      // 'USER' or 'ADMIN'
  return this.service.getProfile(userId);
}
```

---

## DTO Validation Rules

### Common Validators
```typescript
import {
  IsString, IsEmail, IsNumber, IsInt, IsBoolean, IsOptional,
  IsEnum, IsUUID, IsArray, IsUrl, IsNotEmpty,
  Min, Max, MinLength, MaxLength, ArrayMinSize,
  Matches, ValidateNested, Type,
} from 'class-validator';
```

### Pagination Pattern
```typescript
@ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
@ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
)
```

### Search/Filter Pattern
```typescript
@ApiQuery({ name: 'search', required: false })
@ApiQuery({ name: 'category', required: false })
@ApiQuery({ name: 'sortBy', required: false, enum: ['price', 'createdAt', 'name'] })
@ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
findAll(
  @Query('search') search?: string,
  @Query('category') category?: string,
  @Query('sortBy') sortBy?: string,
  @Query('order') order?: 'asc' | 'desc',
)
```

---

## Swagger/OpenAPI Annotations

```typescript
import {
  ApiTags,           // Controller-level tag grouping
  ApiOperation,      // Endpoint summary + description
  ApiBearerAuth,     // Mark as requiring JWT
  ApiParam,          // Path parameter docs
  ApiQuery,          // Query parameter docs
  ApiBody,           // Request body docs
  ApiResponse,       // Response docs
  ApiProperty,       // DTO property docs (required)
  ApiPropertyOptional, // DTO property docs (optional)
} from '@nestjs/swagger';
```

**Swagger is auto-generated at `/api`** (configured in main.ts).

---

## Error Handling

### Standard NestJS Exceptions
```typescript
import {
  NotFoundException,       // 404
  BadRequestException,     // 400
  UnauthorizedException,   // 401
  ForbiddenException,      // 403
  ConflictException,       // 409
  InternalServerErrorException, // 500
} from '@nestjs/common';

// Usage:
throw new NotFoundException('Product not found');
throw new BadRequestException('Invalid quantity');
throw new ConflictException('Email already registered');
```

### Global Exception Filter
The `HttpExceptionFilter` in `common/filters/` catches all exceptions and formats them as:
```json
{
  "statusCode": 404,
  "message": "Product not found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/products/123"
}
```

---

## PrismaService Injection

```typescript
// Always inject via constructor — PrismaModule is global
constructor(private readonly prisma: PrismaService) {}

// Access any model:
this.prisma.user.findMany()
this.prisma.product.create({ data: {...} })
this.prisma.order.update({ where: { id }, data: {...} })
```

### Prisma Transaction Pattern
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  const payment = await tx.payment.create({ data: { orderId: order.id, ...paymentData } });
  await tx.cartItem.deleteMany({ where: { userId } });
  return { order, payment };
});
```

### Prisma Include/Select Pattern
```typescript
// Include relations
const order = await this.prisma.order.findUnique({
  where: { id },
  include: {
    items: { include: { product: true } },
    payments: true,
    address: true,
    user: { select: { id: true, name: true, email: true } },
  },
});
```

---

## Webhook Handler Pattern

```typescript
@Post('webhook/razorpay')
@ApiOperation({ summary: 'Razorpay webhook' })
async handleRazorpayWebhook(
  @Body() body: any,
  @Req() req: any,
  @Headers('x-razorpay-signature') signature: string,
) {
  // 1. Get raw body for signature verification
  const rawBody = req.rawBody;

  // 2. Verify signature
  // 3. Process event based on body.event type
  // 4. Log webhook event in WebhookLog model
}
```

> **rawBody is enabled** in `main.ts` via `NestFactory.create(AppModule, { rawBody: true })`

---

## File Upload Pattern

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile } from '@nestjs/common';

@Post('upload')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  // Upload to Supabase Storage
  const { data, error } = await this.supabaseService
    .getClient()
    .storage
    .from('bucket-name')
    .upload(`path/${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw new BadRequestException(error.message);
  return { url: data.path };
}
```

---

## Logging Pattern

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);

  async create(dto: CreateFeatureDto) {
    this.logger.log(`Creating feature: ${dto.name}`);
    try {
      const result = await this.prisma.feature.create({ data: dto });
      this.logger.log(`Feature created: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create feature: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

---

## Testing Pattern

### Unit Test for Service
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureService } from './feature.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeatureService', () => {
  let service: FeatureService;
  let prisma: PrismaService;

  const mockPrisma = {
    feature: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FeatureService>(FeatureService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a feature', async () => {
    const dto = { name: 'Test', price: 100 };
    mockPrisma.feature.findUnique.mockResolvedValue(null);
    mockPrisma.feature.create.mockResolvedValue({ id: '1', ...dto });

    const result = await service.create(dto as any);
    expect(result.name).toBe('Test');
  });
});
```

---

## @CurrentUser Decorator

The project has a custom `@CurrentUser()` decorator. Use it instead of `@Req() req`:

```typescript
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Get full user
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: any) {
  return this.service.getProfile(user.id);
}

// Get specific field
@Get('my-orders')
@UseGuards(JwtAuthGuard)
getMyOrders(@CurrentUser('id') userId: string) {
  return this.ordersService.findByUser(userId);
}
```

---

## @SkipThrottle for Webhooks

Webhook endpoints must skip the global rate limiter:
```typescript
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Post('webhook/razorpay')
async handleWebhook() { ... }
```

---

## Reference Guides

- **Actual Code Patterns** → [references/actual-code-patterns.md](references/actual-code-patterns.md)
  `@CurrentUser` decorator source, `HttpExceptionFilter` response format and logging behavior, Admin dashboard routes and `AdminAuthContext`, module registration `.js` extension convention, webhook security patterns with `@SkipThrottle` and raw body handling.
