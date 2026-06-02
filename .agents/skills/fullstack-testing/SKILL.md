---
name: fullstack-testing
description: "Testing patterns for TFI Club. ACTIVATE when: writing unit tests, e2e tests, integration tests, mocking Prisma/Supabase/Axios, testing NestJS controllers/services/guards, testing React components, setting up Jest configuration, running test suites, testing payment flows, or debugging test failures. Triggers: test, jest, spec, describe, it, expect, mock, beforeEach, TestingModule, supertest, testing-library."
metadata:
  author: tfi-team
  version: "1.0.0"
---

# Full-Stack Testing — TFI Club

## Test Infrastructure

### Backend (NestJS)
| Tool | Purpose |
|------|---------|
| **Jest** | Test runner + assertion library |
| **@nestjs/testing** | Module mocking + DI container |
| **Supertest** | HTTP request testing for e2e |
| **ts-jest** | TypeScript transformation |

### Configuration
```json
// In backend/package.json → jest config
{
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### Commands
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run specific test file
npx jest --testPathPattern=products.service.spec.ts
```

---

## Backend Unit Tests

### Testing a Service

```typescript
// src/products/products.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  // Mock PrismaService — mock every model method used
  const mockPrisma = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mock call data between tests
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', name: 'T-Shirt', price: 999 },
        { id: '2', name: 'Hoodie', price: 1999 },
      ];
      mockPrisma.product.findMany.mockResolvedValue(mockProducts);
      mockPrisma.product.count.mockResolvedValue(2);

      const result = await service.findAll(1, 20);

      expect(result.items).toEqual(mockProducts);
      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      const mockProduct = { id: '1', name: 'T-Shirt', price: 999 };
      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('1');
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException for missing product', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const dto = { name: 'New Product', price: 1499, categoryId: 'cat-1' };
      const mockCreated = { id: '3', ...dto, slug: 'new-product' };

      mockPrisma.product.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.product.create.mockResolvedValue(mockCreated);

      const result = await service.create(dto as any);
      expect(result.id).toBe('3');
      expect(mockPrisma.product.create).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Testing a Controller

```typescript
// src/products/products.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: ProductsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('GET /products should call findAll', async () => {
    const mockResult = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    mockService.findAll.mockResolvedValue(mockResult);

    const result = await controller.findAll(1, 20);
    expect(result).toEqual(mockResult);
    expect(mockService.findAll).toHaveBeenCalledWith(1, 20);
  });
});
```

### Testing a Guard

```typescript
// src/auth/guards/admin.guard.spec.ts
import { AdminGuard } from './admin.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  const createMockContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any);

  it('should allow admin users', () => {
    const ctx = createMockContext({ id: '1', role: 'ADMIN' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject non-admin users', () => {
    const ctx = createMockContext({ id: '2', role: 'USER' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should reject when no user', () => {
    const ctx = createMockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
```

---

## Backend E2E Tests

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Health Check ──
  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBeDefined();
      });
  });

  // ── Public Endpoints ──
  describe('Products', () => {
    it('GET /api/products should return paginated list', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('GET /api/products/:id should return 404 for invalid ID', () => {
      return request(app.getHttpServer())
        .get('/api/products/nonexistent-id')
        .expect(404);
    });
  });

  // ── Protected Endpoints ──
  describe('Auth-Protected Routes', () => {
    it('GET /api/auth/profile should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('POST /api/products should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/products')
        .send({ name: 'Test', price: 100 })
        .expect(401);
    });
  });

  // ── Validation Tests ──
  describe('DTO Validation', () => {
    it('POST /api/auth/signup should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', password: '12345678', name: 'Test' })
        .expect(400);
    });
  });
});
```

### E2E Test Config
```json
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

---

## Mock Patterns

### Mock PrismaService (Reusable)
```typescript
export const createMockPrismaService = () => ({
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((fn) => fn(createMockPrismaService())),
});
```

### Mock SupabaseService
```typescript
export const createMockSupabaseService = () => ({
  getClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
  })),
});
```

### Mock Authenticated Request
```typescript
// For e2e tests that need auth:
const authToken = 'valid-test-jwt-token';

request(app.getHttpServer())
  .get('/api/auth/profile')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

---

## Test File Naming Convention

| Type | File Pattern | Location |
|------|-------------|----------|
| Unit test | `*.spec.ts` | Same directory as source file |
| E2E test | `*.e2e-spec.ts` | `backend/test/` directory |

Example:
```
backend/src/products/
├── products.service.ts
├── products.service.spec.ts     ← Unit test
├── products.controller.ts
├── products.controller.spec.ts  ← Unit test
```

---

## Payment Flow Testing

### Razorpay Test Mode
```typescript
describe('Razorpay Payment Flow', () => {
  it('should create a Razorpay order', async () => {
    // Use test credentials (rzp_test_*)
    const result = await request(app.getHttpServer())
      .post('/api/payments/razorpay/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId: testOrderId, amount: 99900 }) // ₹999 in paise
      .expect(201);

    expect(result.body.razorpayOrderId).toBeDefined();
    expect(result.body.amount).toBe(99900);
  });
});
```

### Stripe Test Mode
```typescript
describe('Stripe Payment Flow', () => {
  it('should create a Stripe checkout session', async () => {
    // Use test credentials (sk_test_*)
    const result = await request(app.getHttpServer())
      .post('/api/payments/stripe/create-session')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ orderId: testOrderId })
      .expect(201);

    expect(result.body.sessionId).toBeDefined();
    expect(result.body.url).toContain('checkout.stripe.com');
  });
});
```

---

## Running Tests

```bash
# Backend — all unit tests
cd backend && npm test

# Backend — watch mode (re-runs on file changes)
cd backend && npm run test:watch

# Backend — specific file
cd backend && npx jest products.service.spec

# Backend — with coverage report
cd backend && npm run test:cov

# Backend — e2e tests
cd backend && npm run test:e2e

# Frontend — if testing library is configured
cd frontend && npm test
```

---

## Scaffolding Scripts

You can automatically generate boilerplate unit tests for a new module using the provided scaffolding script:

```bash
cd .agents/skills/fullstack-testing/scripts/
node scaffold-test.js feature-name
```

This will automatically create `feature-name.service.spec.ts` and `feature-name.controller.spec.ts` with all the boilerplate Prisma and Service mocks configured.
