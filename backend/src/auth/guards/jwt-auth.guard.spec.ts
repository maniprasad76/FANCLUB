import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * JwtAuthGuard Unit Tests
 *
 * Tests cover:
 *   - Missing authorization header
 *   - Malformed authorization header (not Bearer)
 *   - Invalid/expired token (Supabase returns error)
 *   - Valid token but user not in local DB
 *   - Valid token and user found — attaches req.user
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let supabaseService: any;
  let prisma: any;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      auth: {
        getUser: jest.fn(),
      },
    };

    supabaseService = {
      getClient: jest.fn(() => mockClient),
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    guard = new JwtAuthGuard(supabaseService, prisma);
  });

  function createMockContext(authHeader?: string) {
    const request: any = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  it('throws UnauthorizedException when no authorization header', async () => {
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException for non-Bearer token', async () => {
    const context = createMockContext('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when Supabase returns error', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Token expired' },
    });

    const context = createMockContext('Bearer expired-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when user not found in local DB', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-orphan' } },
      error: null,
    });
    prisma.user.findUnique.mockResolvedValue(null);

    const context = createMockContext('Bearer valid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches user to request and returns true on valid token', async () => {
    mockClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'auth-1' } },
      error: null,
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      authId: 'auth-1',
    });

    const context = createMockContext('Bearer valid-token');
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    const request = context.switchToHttp().getRequest();
    expect(request.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      authId: 'auth-1',
    });
  });
});
