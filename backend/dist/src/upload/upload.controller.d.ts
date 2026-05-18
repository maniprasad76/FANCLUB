import { UploadService } from './upload.service';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    getSignedUploadUrl(bucket: string, filename: string): Promise<{
        signedUrl: string;
        path: string;
        publicUrl: string;
        token: string;
    }>;
    deleteFile(bucket: string, path: string): Promise<{
        message: string;
    }>;
    uploadImage(file: Express.Multer.File): {
        success: boolean;
        url: string;
    };
}
