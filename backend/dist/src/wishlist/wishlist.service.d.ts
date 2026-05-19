import { PrismaService } from '../prisma/prisma.service';
export declare class WishlistService {
    private prisma;
    constructor(prisma: PrismaService);
    getWishlist(authId: string): Promise<({
        product: {
            category: {
                name: string;
                id: string;
                slug: string;
            };
        } & {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string;
            isActive: boolean;
            categoryId: string;
            price: number;
            comparePrice: number | null;
            images: string[];
            sizes: string[];
            colors: string[];
            stock: number;
            featured: boolean;
            bestseller: boolean;
            newArrival: boolean;
            tags: string[];
            gender: import("@prisma/client").$Enums.Gender;
            rating: number;
            reviewCount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
    })[]>;
    toggle(authId: string, productId: string): Promise<{
        added: boolean;
        message: string;
    }>;
    remove(authId: string, productId: string): Promise<{
        message: string;
    }>;
}
