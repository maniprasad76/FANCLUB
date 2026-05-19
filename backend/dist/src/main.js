"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.setGlobalPrefix('api');
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://checkout.razorpay.com',
                    'https://js.stripe.com',
                ],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                fontSrc: ["'self'", 'https://fonts.gstatic.com'],
                imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
                mediaSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
                connectSrc: [
                    "'self'",
                    'https://*.supabase.co',
                    'https://api.razorpay.com',
                    'https://lux-cdn.razorpay.com',
                    'https://api.stripe.com',
                ],
                frameSrc: [
                    "'self'",
                    'https://checkout.razorpay.com',
                    'https://*.supabase.co',
                    'https://js.stripe.com',
                    'https://hooks.stripe.com',
                ],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.ADMIN_URL,
        'https://tfi-frontend-kappa.vercel.app',
        'https://tfi-admin-six.vercel.app',
    ].filter(Boolean);
    const uniqueOrigins = [...new Set(allowedOrigins)];
    app.enableCors({
        origin: uniqueOrigins.length > 0 ? uniqueOrigins : true,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'public'), {
        prefix: '/public',
    });
    const port = process.env.PORT || 5000;
    await app.listen(port, '0.0.0.0');
    console.log(`🎬 TFI Backend running on http://0.0.0.0:${port} (Network Exposed)`);
}
bootstrap();
//# sourceMappingURL=main.js.map