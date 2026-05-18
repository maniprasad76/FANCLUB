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
exports.ContactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContactService = class ContactService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(name, email, subject, message) {
        return this.prisma.contact.create({ data: { name, email, subject, message } });
    }
    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [messages, total] = await Promise.all([
            this.prisma.contact.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
            this.prisma.contact.count(),
        ]);
        return { messages, total, page, pages: Math.ceil(total / limit) };
    }
    async markRead(id) {
        const contact = await this.prisma.contact.findUnique({ where: { id } });
        if (!contact)
            throw new common_1.NotFoundException('Message not found');
        return this.prisma.contact.update({ where: { id }, data: { isRead: true } });
    }
    async delete(id) {
        await this.prisma.contact.delete({ where: { id } });
        return { message: 'Deleted' };
    }
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContactService);
//# sourceMappingURL=contact.service.js.map