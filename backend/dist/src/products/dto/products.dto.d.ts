import { Gender } from '@prisma/client';
export declare class CreateProductDto {
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    sizes: string[];
    colors: string[];
    categoryId: string;
    stock: number;
    featured?: boolean;
    bestseller?: boolean;
    newArrival?: boolean;
    tags?: string[];
    gender?: Gender;
}
export declare class UpdateProductDto {
    name?: string;
    slug?: string;
    description?: string;
    price?: number;
    comparePrice?: number;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    categoryId?: string;
    stock?: number;
    featured?: boolean;
    bestseller?: boolean;
    newArrival?: boolean;
    isActive?: boolean;
    tags?: string[];
    gender?: Gender;
}
export declare class ProductQueryDto {
    category?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    size?: string;
    color?: string;
    featured?: boolean;
    bestseller?: boolean;
    newArrival?: boolean;
    page?: number;
    limit?: number;
    gender?: string;
}
