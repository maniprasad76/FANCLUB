import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Supabase JWT auth guard — validates Supabase-issued access tokens.
 *
 * 1. Extract Bearer token from Authorization header
 * 2. Validate token via Supabase's getUser() endpoint
 * 3. Look up user in local Prisma DB by authId
 * 4. Attach user info to req.user (including authId, role)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      // Validate token via Supabase Auth
      const client = this.supabaseService.getClient();
      const {
        data: { user: authUser },
        error,
      } = await client.auth.getUser(token);

      if (error || !authUser) {
        throw new UnauthorizedException(
          `Invalid or expired token: ${error?.message || 'No user returned'}`,
        );
      }

      // Look up user in local DB
      const dbUser = await this.prisma.user.findUnique({
        where: { authId: authUser.id },
        select: { id: true, email: true, name: true, role: true, authId: true },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      // Attach user info to request
      (request as any).user = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        authId: dbUser.authId,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Auth guard error: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) return null;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return null;

    return token;
  }
}
