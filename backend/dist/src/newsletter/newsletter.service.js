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
exports.NewsletterService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NewsletterService = class NewsletterService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async subscribe(email) {
        try {
            await this.prisma.newsletter.create({ data: { email } });
            return { message: 'Subscribed successfully' };
        }
        catch {
            throw new common_1.ConflictException('Email already subscribed');
        }
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [subscribers, total] = await Promise.all([
            this.prisma.newsletter.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
            this.prisma.newsletter.count(),
        ]);
        return { subscribers, total, page, pages: Math.ceil(total / limit) };
    }
    async delete(id) {
        await this.prisma.newsletter.delete({ where: { id } });
        return { message: 'Unsubscribed' };
    }
};
exports.NewsletterService = NewsletterService;
exports.NewsletterService = NewsletterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NewsletterService);
//# sourceMappingURL=newsletter.service.js.map