import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    getCart(authId: string): Promise<{
        items: ({
            product: {
                name: string;
                id: string;
                slug: string;
                price: number;
                comparePrice: number | null;
                images: string[];
                stock: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            size: string | null;
            color: string | null;
            productId: string;
            quantity: number;
        })[];
        total: number;
        count: number;
    }>;
    addToCart(authId: string, dto: AddToCartDto): Promise<{
        product: {
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
        updatedAt: Date;
        userId: string;
        size: string | null;
        color: string | null;
        productId: string;
        quantity: number;
    }>;
    updateItem(itemId: string, dto: UpdateCartItemDto): Promise<{
        product: {
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
        updatedAt: Date;
        userId: string;
        size: string | null;
        color: string | null;
        productId: string;
        quantity: number;
    }>;
    removeItem(itemId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        size: string | null;
        color: string | null;
        productId: string;
        quantity: number;
    }>;
    clearCart(authId: string): Promise<{
        message: string;
    }>;
}
