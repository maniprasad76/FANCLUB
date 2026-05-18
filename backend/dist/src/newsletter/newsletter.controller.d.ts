import { NewsletterService } from './newsletter.service';
export declare class NewsletterController {
    private newsletterService;
    constructor(newsletterService: NewsletterService);
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
