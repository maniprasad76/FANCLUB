import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { passportJwtSecret } from 'jwks-rsa';

/**
 * Custom JWT extractor: tries httpOnly cookie first, falls back to Authorization header.
 * This ensures backward compatibility during the localStorage → cookie migration.
 */
function cookieOrHeaderExtractor(req: Request): string | null {
  // 1. Try httpOnly cookie
  if (req?.cookies?.access_token) {
    return req.cookies.access_token;
  }
  // 2. Fallback to Authorization: Bearer header
  const headerExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
  return headerExtractor(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get<string>('SUPABASE_URL')!;

    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      // Supabase uses ES256 (asymmetric) JWTs — verify via JWKS public keys
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      }),
      algorithms: ['ES256'],
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      authId: payload.sub,
      email: payload.email,
      role: payload.role || payload.user_metadata?.role || 'USER',
    };
  }
}
