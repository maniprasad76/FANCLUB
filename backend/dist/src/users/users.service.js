"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count(),
        ]);
        return { users, total, page, pages: Math.ceil(total / limit) };
    }
    async findByAuthId(authId) {
        const user = await this.prisma.user.findUnique({
            where: { authId },
            include: { addresses: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { addresses: true, orders: { orderBy: { createdAt: 'desc' }, take: 5 } },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async update(authId, dto) {
        return this.prisma.user.update({ where: { authId }, data: dto });
    }
    async addAddress(authId, dto) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.isDefault) {
            await this.prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
        }
        return this.prisma.address.create({ data: { ...dto, userId: user.id } });
    }
    async updateAddress(authId, addressId, dto) {
        const user = await this.prisma.user.findUnique({ where: { authId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (dto.isDefault) {
            await this.prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
        }
        return this.prisma.address.update({ where: { id: addressId }, data: dto });
    }
    async deleteAddress(addressId) {
        return this.prisma.address.delete({ where: { id: addressId } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map