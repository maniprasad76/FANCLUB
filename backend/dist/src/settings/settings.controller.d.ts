import { SettingsService } from './settings.service';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getFooterVideo(): {
        url: any;
    };
    uploadFooterVideo(file: Express.Multer.File): {
        success: boolean;
        url: string;
    };
    getAboutImage(): {
        url: any;
    };
    uploadAboutImage(file: Express.Multer.File): {
        success: boolean;
        url: string;
    };
    deleteFooterVideo(): {
        success: boolean;
    };
    deleteAboutImage(): {
        success: boolean;
    };
}
