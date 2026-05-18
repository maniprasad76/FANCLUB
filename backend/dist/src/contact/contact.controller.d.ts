import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/contact.dto';
export declare class ContactController {
    private contactService;
    constructor(contactService: ContactService);
    create(dto: CreateContactDto): Promise<{
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
