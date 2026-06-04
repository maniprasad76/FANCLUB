---
name: prisma-automation
description: "Prisma ORM automation for FAN Club. ACTIVATE when: modifying database schema, creating/running migrations, writing Prisma queries, adding new models or relations, seeding data, debugging Prisma connection issues, optimizing database queries, working with Prisma transactions, or configuring Prisma with Supabase PostgreSQL. Triggers: schema.prisma, prisma migrate, prisma generate, prisma db, PrismaService, PrismaClient, @@map, @relation."
metadata:
  author: fan-team
  version: "1.0.0"
---

# Prisma Automation — FAN Club

## Schema Location & Configuration

- **Schema file:** `backend/prisma/schema.prisma`
- **Prisma config:** `backend/prisma.config.ts` (contains `DIRECT_URL` for migrations)
- **Migrations:** `backend/supabase/migrations/`

### Connection Setup
```prisma
generator client {
  provider     = "prisma-client-js"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```
- Uses `@prisma/adapter-pg` for Supabase connection pooler
- `DATABASE_URL` — Supabase Session Mode Pooler (for runtime queries)
- `DIRECT_URL` — Direct Supabase connection (for migrations only)

---

## Adding a New Model — Complete Workflow

### Step 1: Define the Model in `schema.prisma`

**Follow these naming conventions:**
```prisma
model FeatureName {
  id        String   @id @default(uuid())    // Always UUID
  // ... fields ...
  createdAt DateTime @default(now())          // Always include
  updatedAt DateTime @updatedAt              // Always include

  // Relations
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes for common queries
  @@index([userId])
  @@map("feature_names")                     // snake_case table name
}
```

**Naming rules:**
| Element | Convention | Example |
|---------|-----------|---------|
| Model name | PascalCase | `CartItem`, `WebhookLog` |
| Table name (@@map) | snake_case | `cart_items`, `webhook_logs` |
| Field names | camelCase | `userId`, `createdAt`, `gatewayPaymentId` |
| ID fields | `String @id @default(uuid())` | Always UUID |
| Timestamps | `createdAt` + `updatedAt` | On every model |
| Foreign keys | `modelId` | `userId`, `productId`, `orderId` |
| Boolean defaults | `@default(false)` or `@default(true)` | `isActive`, `isDefault` |
| Enums | PascalCase | `OrderStatus`, `PaymentGateway` |
| Enum values | SCREAMING_SNAKE | `PENDING`, `IN_PROGRESS` |

### Step 2: Add Relations to Existing Models

If your new model relates to an existing model, add the reverse relation:
```prisma
// In the existing User model, add:
model User {
  // ... existing fields ...
  featureNames FeatureName[]    // Add the reverse relation
}
```

### Step 3: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 4: Create Migration
```bash
# Development (creates migration + applies it)
npx prisma migrate dev --name add_feature_names

# Production (applies pending migrations only)
npx prisma migrate deploy
```

### Step 5: Verify
```bash
# Check migration status
npx prisma migrate status

# Open Prisma Studio to inspect data
npx prisma studio
```

---

## Common Schema Patterns

### One-to-Many Relation
```prisma
model Category {
  id       String    @id @default(uuid())
  name     String    @unique
  products Product[]    // Reverse relation (no field in DB)
  @@map("categories")
}

model Product {
  id         String   @id @default(uuid())
  categoryId String                          // FK field
  category   Category @relation(fields: [categoryId], references: [id])
  @@index([categoryId])                      // Always index FKs
  @@map("products")
}
```

### Many-to-Many (Implicit)
```prisma
model Product {
  id   String @id @default(uuid())
  tags Tag[]
}

model Tag {
  id       String    @id @default(uuid())
  products Product[]
}
```

### Many-to-Many (Explicit — for extra fields)
```prisma
model Order {
  id    String      @id @default(uuid())
  items OrderItem[]
}

model Product {
  id         String      @id @default(uuid())
  orderItems OrderItem[]
}

model OrderItem {
  id        String  @id @default(uuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  quantity  Int
  price     Float      // Snapshot at time of order
  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}
```

### Unique Constraint
```prisma
model CartItem {
  // Composite unique: one item per user+product+size+color
  @@unique([userId, productId, size, color])
}
```

### Enum Definition
```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}
```

### JSON Field
```prisma
model Payment {
  metadata Json?    // Stores arbitrary JSON data
}
```

### Array Fields
```prisma
model Product {
  images String[]    // PostgreSQL text array
  sizes  String[]
  colors String[]
  tags   String[]
}
```

---

## Query Patterns in NestJS Services

### Basic CRUD
```typescript
// CREATE
const product = await this.prisma.product.create({
  data: {
    name: dto.name,
    slug: this.generateSlug(dto.name),
    price: dto.price,
    categoryId: dto.categoryId,
    images: dto.images || [],
    sizes: dto.sizes || [],
  },
});

// READ with pagination
const [items, total] = await Promise.all([
  this.prisma.product.findMany({
    where: { isActive: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { category: true },
  }),
  this.prisma.product.count({ where: { isActive: true } }),
]);

// UPDATE
const updated = await this.prisma.product.update({
  where: { id },
  data: dto,
});

// DELETE (soft delete via isActive flag)
await this.prisma.product.update({
  where: { id },
  data: { isActive: false },
});

// DELETE (hard delete)
await this.prisma.product.delete({ where: { id } });
```

### Complex Filters
```typescript
const where: any = { isActive: true };

if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ];
}

if (categoryId) where.categoryId = categoryId;
if (gender) where.gender = gender;
if (minPrice || maxPrice) {
  where.price = {};
  if (minPrice) where.price.gte = minPrice;
  if (maxPrice) where.price.lte = maxPrice;
}

const products = await this.prisma.product.findMany({
  where,
  orderBy: { [sortBy || 'createdAt']: order || 'desc' },
});
```

### Transactions
```typescript
const result = await this.prisma.$transaction(async (tx) => {
  // All operations in this block are atomic
  const order = await tx.order.create({ data: orderData });

  for (const item of cartItems) {
    await tx.orderItem.create({ data: { orderId: order.id, ...item } });
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  await tx.cartItem.deleteMany({ where: { userId } });
  return order;
});
```

### Aggregations
```typescript
// Count orders by status
const orderCounts = await this.prisma.order.groupBy({
  by: ['status'],
  _count: { id: true },
});

// Sum total revenue
const revenue = await this.prisma.payment.aggregate({
  where: { status: 'COMPLETED' },
  _sum: { amount: true },
});

// Average product rating
const avgRating = await this.prisma.review.aggregate({
  where: { productId },
  _avg: { rating: true },
  _count: { id: true },
});
```

---

## Indexing Strategy

**Always add indexes for:**
1. **Foreign keys** — `@@index([userId])`, `@@index([productId])`
2. **Status fields** — `@@index([status])` for filtered queries
3. **Timestamp fields** — `@@index([createdAt])` for sorting
4. **Boolean filters** — `@@index([isActive])`, `@@index([featured])`
5. **Composite indexes** for combined queries — `@@index([featured, isActive])`
6. **Unique constraints** for business rules — `@@unique([userId, productId])`

---

## Migration Best Practices

1. **Always name migrations descriptively:**
   ```bash
   npx prisma migrate dev --name add_coupon_codes
   npx prisma migrate dev --name add_shipping_tracking_to_orders
   ```

2. **Check migration SQL before applying in production:**
   ```bash
   npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-migrations prisma/migrations --script
   ```

3. **Reset development database (DESTRUCTIVE):**
   ```bash
   npx prisma migrate reset
   ```

4. **Pull schema from existing database:**
   ```bash
   npx prisma db pull
   ```

---

## Common Pitfalls

1. **`moduleFormat = "cjs"` is required** — the project uses CJS for Prisma client
2. **Don't forget `@@map`** — every model needs a snake_case table name
3. **Always `@@index` foreign keys** — PostgreSQL doesn't auto-index FKs
4. **Use `onDelete: Cascade`** for child records that should be deleted with parent
5. **`Float` for prices** — Prisma maps this to PostgreSQL `double precision`
6. **`@updatedAt` auto-updates** — no need to manually set timestamps
7. **`@default(uuid())` for IDs** — consistent UUID generation across the project
8. **Run `npx prisma generate`** after every schema change before running the app

---

## Reference Guides

- **Complete Schema Reference** → [references/schema-reference.md](references/schema-reference.md)
  All 16 models, 6 enums, complete index catalog, cascade delete rules, and entity relationship diagram — extracted from the actual `schema.prisma` file.
