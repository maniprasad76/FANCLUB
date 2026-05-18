"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const supabase_js_1 = require("@supabase/supabase-js");
const uuid_1 = require("uuid");
let UploadService = class UploadService {
    configService;
    supabase;
    constructor(configService) {
        this.configService = configService;
        this.supabase = (0, supabase_js_1.createClient)(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_SERVICE_ROLE_KEY'));
    }
    async getSignedUploadUrl(bucket, filename) {
        const ext = filename.split('.').pop();
        const path = `${(0, uuid_1.v4)()}.${ext}`;
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .createSignedUploadUrl(path);
        if (error)
            throw error;
        const publicUrl = `${this.configService.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${path}`;
        return { signedUrl: data.signedUrl, path, publicUrl, token: data.token };
    }
    async deleteFile(bucket, path) {
        const { error } = await this.supabase.storage.from(bucket).remove([path]);
        if (error)
            throw error;
        return { message: 'File deleted' };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map