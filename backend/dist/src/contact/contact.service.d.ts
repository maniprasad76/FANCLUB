import { PrismaService } from '../prisma/prisma.service';
export declare class ContactService {
    private prisma;
    constructor(prisma: PrismaService);
    create(name: string, email: string, subject: string, message: string): Promise<{
        email: string;
        message: string;
        name: string;
        id: string;
        createdAt: Date;
        subject: string;
        isRead: boolean;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        messages: {
            email: string;
            message: string;
            name: string;
            id: string;
            createdAt: Date;
            subject: string;
            isRead: boolean;
        }[];
        total: number;
        page: number;
        pages: number;
    }>;
    markRead(id: string): Promise<{
        email: string;
        message: string;
        name: string;
        id: string;
        createdAt: Date;
        subject: string;
        isRead: boolean;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
