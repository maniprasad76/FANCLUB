import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
export declare class ReviewsController {
    private reviewsService;
    constructor(reviewsService: ReviewsService);
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
    create(authId: string, dto: CreateReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        rating: number;
        productId: string;
        comment: string | null;
    }>;
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
