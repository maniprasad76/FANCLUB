import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

/**
 * ProductsService Unit Tests
 *
 * Tests cover:
 *   - findAll: default query, category filter, search, pagination, sorting
 *   - findBySlug: found, not found
 *   - findById: found, not found
 *   - getFeatured: returns featured products only
 *   - create: creates product with DTO
 *   - update: updates product by ID
 *   - delete: deletes product by ID
 */
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  const mockProduct = {
    id: 'prod-1',
    name: 'FAN Pushpa Tee',
    slug: 'fan-pushpa-tee',
    description: 'Inspired by Pushpa Raj',
    price: 999,
    images: ['img1.jpg'],
    sizes: ['M', 'L', 'XL'],
    colors: ['Black'],
    categoryId: 'cat-1',
    stock: 50,
    featured: true,
    isActive: true,
    rating: 4.5,
    reviewCount: 12,
    category: { id: 'cat-1', name: 'T-Shirts', slug: 't-shirts' },
  };

  beforeEach(() => {
    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      cartItem: { deleteMany: jest.fn() },
      wishlist: { deleteMany: jest.fn() },
      review: { deleteMany: jest.fn() },
      $transaction: jest.fn((txs) => Promise.all(txs)),
    };

    service = new ProductsService(prisma);
  });

  // ─── findAll ─────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated products with default query', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 12,
        }),
      );
    });

    it('applies category filter', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ category: 't-shirts' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: { slug: 't-shirts' },
          }),
        }),
      );
    });

    it('applies search filter across name, description, and tags', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ search: 'pushpa' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: { contains: 'pushpa', mode: 'insensitive' },
              }),
            ]),
          }),
        }),
      );
    });

    it('applies price_asc sorting', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await service.findAll({ sort: 'price_asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        }),
      );
    });

    it('handles pagination correctly', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.page).toBe(2);
      expect(result.pages).toBe(3); // ceil(25/10)
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  // ─── findBySlug ──────────────────────────────────────────────

  describe('findBySlug', () => {
    it('returns product with reviews when found', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        reviews: [],
      });

      const result = await service.findBySlug('fan-pushpa-tee');

      expect(result.slug).toBe('fan-pushpa-tee');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────

  describe('findById', () => {
    it('returns product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findById('prod-1');

      expect(result.id).toBe('prod-1');
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── getFeatured ─────────────────────────────────────────────

  describe('getFeatured', () => {
    it('returns only featured active products, max 8', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.getFeatured();

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { featured: true, isActive: true },
          take: 8,
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  // ─── create ──────────────────────────────────────────────────

  describe('create', () => {
    it('creates a product with provided DTO', async () => {
      const dto = {
        name: 'New Product',
        slug: 'new-product',
        description: 'A new product',
        price: 799,
        categoryId: 'cat-1',
        images: [],
        sizes: [],
        colors: [],
        tags: [],
      };
      prisma.product.create.mockResolvedValue({ id: 'new-id', ...dto });

      const result = await service.create(dto as any);

      expect(result.id).toBe('new-id');
      expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  // ─── update ──────────────────────────────────────────────────

  describe('update', () => {
    it('updates a product by ID', async () => {
      const dto = { name: 'Updated Name' };
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Name',
      });

      const result = await service.update('prod-1', dto as any);

      expect(result.name).toBe('Updated Name');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: dto,
      });
    });
  });

  // ─── delete ──────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes a product by ID', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      await service.delete('prod-1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
    });

    it('throws NotFoundException for non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── bulkDelete ──────────────────────────────────────────────

  describe('bulkDelete', () => {
    it('deletes multiple products by IDs', async () => {
      prisma.product.deleteMany.mockResolvedValue({ count: 3 });

      await service.bulkDelete(['id-1', 'id-2', 'id-3']);

      expect(prisma.product.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['id-1', 'id-2', 'id-3'] } },
      });
    });
  });
});
