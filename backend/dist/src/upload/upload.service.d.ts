import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private configService;
    private supabase;
    constructor(configService: ConfigService);
    getSignedUploadUrl(bucket: string, filename: string): Promise<{
        signedUrl: string;
        path: string;
        publicUrl: string;
        token: string;
    }>;
    deleteFile(bucket: string, path: string): Promise<{
        message: string;
    }>;
}
