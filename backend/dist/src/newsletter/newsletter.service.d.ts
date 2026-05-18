import { PrismaService } from '../prisma/prisma.service';
export declare class NewsletterService {
    private prisma;
    constructor(prisma: PrismaService);
    subscribe(email: string): Promise<{
        message: string;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        subscribers: {
            email: string;
            id: string;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
