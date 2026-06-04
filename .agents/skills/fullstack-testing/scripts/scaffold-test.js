#!/usr/bin/env node
/**
 * FAN NestJS Test Scaffolder
 * 
 * Usage: node scaffold-test.js feature-name
 * 
 * Creates unit tests for a feature module:
 *   backend/src/feature-name/feature-name.service.spec.ts
 *   backend/src/feature-name/feature-name.controller.spec.ts
 */

const fs = require('fs');
const path = require('path');

const rawName = process.argv[2];
if (!rawName) {
  console.error('Usage: node scaffold-test.js <feature-name>');
  process.exit(1);
}

const kebab = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-');
const pascal = kebab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

const moduleDir = path.join(__dirname, '..', '..', '..', 'backend', 'src', kebab);

if (!fs.existsSync(moduleDir)) {
  console.error(`Error: Module directory ${moduleDir} does not exist.`);
  console.error(`Create the module first using scaffold-module.js`);
  process.exit(1);
}

// ── Service Spec ──
const serviceSpec = `import { Test, TestingModule } from '@nestjs/testing';
import { ${pascal}Service } from './${kebab}.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('${pascal}Service', () => {
  let service: ${pascal}Service;
  let prisma: PrismaService;

  const mockPrisma = {
    ${camel}: {
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
        ${pascal}Service,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<${pascal}Service>(${pascal}Service);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      mockPrisma.${camel}.findMany.mockResolvedValue([]);
      mockPrisma.${camel}.count.mockResolvedValue(0);

      const result = await service.findAll(1, 20);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return an item', async () => {
      const mockItem = { id: '1', name: 'Test' };
      mockPrisma.${camel}.findUnique.mockResolvedValue(mockItem);

      const result = await service.findOne('1');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException if missing', async () => {
      mockPrisma.${camel}.findUnique.mockResolvedValue(null);
      await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
    });
  });
});
`;

// ── Controller Spec ──
const controllerSpec = `import { Test, TestingModule } from '@nestjs/testing';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

describe('${pascal}Controller', () => {
  let controller: ${pascal}Controller;
  let service: ${pascal}Service;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${pascal}Controller],
      providers: [
        { provide: ${pascal}Service, useValue: mockService },
      ],
    }).compile();

    controller = module.get<${pascal}Controller>(${pascal}Controller);
    service = module.get<${pascal}Service>(${pascal}Service);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const mockResult = { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
      mockService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(1, 20);
      expect(result).toEqual(mockResult);
      expect(mockService.findAll).toHaveBeenCalledWith(1, 20);
    });
  });
});
`;

fs.writeFileSync(path.join(moduleDir, `${kebab}.service.spec.ts`), serviceSpec);
fs.writeFileSync(path.join(moduleDir, `${kebab}.controller.spec.ts`), controllerSpec);

console.log(`✅ Created test files in ${moduleDir}/:`);
console.log(`   ├── ${kebab}.service.spec.ts`);
console.log(`   └── ${kebab}.controller.spec.ts`);
console.log(`\n📝 Run them using: npm test -- ${kebab}`);
