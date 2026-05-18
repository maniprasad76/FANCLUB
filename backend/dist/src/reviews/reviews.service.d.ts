import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(authId: string, productId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        rating: number;
        productId: string;
        comment: string | null;
    }>;
    findByProduct(productId: string): Promise<({
        user: {
            name: string | null;
            id: string;
            avatar: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        rating: number;
        productId: string;
        comment: string | null;
    })[]>;
    adminFindAll(page?: number, limit?: number): Promise<{
        reviews: ({
            user: {
                email: string;
                name: string | null;
                id: string;
            };
            product: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            rating: number;
            productId: string;
            comment: string | null;
        })[];
        total: number;
        page: number;
        pages: number;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
