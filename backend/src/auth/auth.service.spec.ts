import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * AuthService Unit Tests
 *
 * Tests cover:
 *   - signUp: happy path, duplicate email (enumeration-safe), race condition
 *   - signIn: happy path, invalid credentials, email enumeration prevention
 *   - refreshToken: happy path, expired token
 *   - logout: success, graceful failure
 *   - getProfile: found, not found
 *   - syncOAuthUser: new user, existing user, link existing
 */
describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let supabaseService: any;
  let configService: any;
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      auth: {
        admin: {
          createUser: jest.fn(),
          deleteUser: jest.fn(),
          signOut: jest.fn(),
        },
        signInWithPassword: jest.fn(),
        refreshSession: jest.fn(),
        getUser: jest.fn(),
        resetPasswordForEmail: jest.fn(),
      },
    };

    supabaseService = {
      getClient: jest.fn(() => mockClient),
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    configService = {
      get: jest.fn(),
    };

    service = new AuthService(supabaseService, prisma, configService);
  });

  // ─── SIGN UP ─────────────────────────────────────────────────

  describe('signUp', () => {
    const GENERIC_MESSAGE =
      'Registration successful. Please check your email to confirm your account.';

    it('creates a new user with email_confirm: false and no session (enumeration-safe)', async () => {
      mockClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'auth-123' } },
        error: null,
      });
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        avatar: null,
        role: 'USER',
      });

      const result = await service.signUp(
        'Test@Example.com',
        'password123',
        'Test User',
      );

      // User must NOT get a session — email confirmation is required first
      expect(result.user).toBeUndefined();
      expect(result.session).toBeUndefined();
      expect(result.message).toBe(GENERIC_MESSAGE);

      // Supabase user must be created with email_confirm: false
      expect(mockClient.auth.admin.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: false,
        user_metadata: { name: 'Test User' },
      });

      // Local user created
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          authId: 'auth-123',
          role: 'USER',
        },
      });
    });

    it('returns generic success (does NOT throw) if email already registered', async () => {
      mockClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User already registered' },
      });

      const result = await service.signUp(
        'test@example.com',
        'password',
        'Test',
      );

      // Same message as a fresh signup — no account enumeration
      expect(result.message).toBe(GENERIC_MESSAGE);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('returns generic success if Supabase says email already exists', async () => {
      mockClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'A user with this email already exists' },
      });

      const result = await service.signUp(
        'test@example.com',
        'password',
        'Test',
      );

      expect(result.message).toBe(GENERIC_MESSAGE);
    });

    it('handles race condition — cleans up orphaned Supabase user on Prisma P2002 and returns generic success', async () => {
      mockClient.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'auth-orphan' } },
        error: null,
      });
      const prismaError = new Error('Unique constraint violation');
      (prismaError as any).code = 'P2002';
      prisma.user.create.mockRejectedValue(prismaError);
      mockClient.auth.admin.deleteUser.mockResolvedValue({});

      const result = await service.signUp(
        'test@example.com',
        'password',
        'Test',
      );

      // Generic success — not an enumeration-friendly error
      expect(result.message).toBe(GENERIC_MESSAGE);

      // Verify cleanup was attempted
      expect(mockClient.auth.admin.deleteUser).toHaveBeenCalledWith(
        'auth-orphan',
      );
    });

    it('throws BadRequestException on generic Supabase errors without leaking details', async () => {
      mockClient.auth.admin.createUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid email format' },
      });

      await expect(
        service.signUp('not-an-email', 'password', 'Test'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── SIGN IN ─────────────────────────────────────────────────

  describe('signIn', () => {
    it('returns user and session on valid credentials', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'auth-1', user_metadata: {} },
          session: { access_token: 'at', refresh_token: 'rt' },
        },
        error: null,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        phone: null,
        avatar: null,
        role: 'USER',
      });

      const result = await service.signIn('test@example.com', 'password');

      expect(result.user.id).toBe('user-1');
      expect(result.session.access_token).toBe('at');
    });

    it('throws UnauthorizedException on wrong credentials (prevents email enumeration)', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(
        service.signIn('nonexistent@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('uses generic error message — does not reveal if email exists', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      try {
        await service.signIn('test@example.com', 'wrong');
      } catch (e) {
        expect((e as UnauthorizedException).message).toBe(
          'Invalid email or password. Please try again.',
        );
      }
    });

    it('auto-creates local user if Supabase user exists but local DB does not', async () => {
      mockClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: { id: 'auth-new', user_metadata: { name: 'New User' } },
          session: { access_token: 'at', refresh_token: 'rt' },
        },
        error: null,
      });
      prisma.user.findUnique.mockResolvedValue(null); // No local user
      prisma.user.create.mockResolvedValue({
        id: 'new-local',
        email: 'new@example.com',
        name: 'New User',
        phone: null,
        avatar: null,
        role: 'USER',
      });

      const result = await service.signIn('new@example.com', 'password');

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.user.id).toBe('new-local');
    });
  });

  // ─── REFRESH TOKEN ───────────────────────────────────────────

  describe('refreshToken', () => {
    it('returns fresh session on valid refresh token', async () => {
      mockClient.auth.refreshSession.mockResolvedValue({
        data: {
          user: { id: 'auth-1' },
          session: { access_token: 'new-at', refresh_token: 'new-rt' },
        },
        error: null,
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        phone: null,
        avatar: null,
        role: 'USER',
      });

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.session.access_token).toBe('new-at');
    });

    it('throws UnauthorizedException on expired refresh token', async () => {
      mockClient.auth.refreshSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Token expired' },
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── LOGOUT ──────────────────────────────────────────────────

  describe('logout', () => {
    it('returns success even if Supabase call fails (graceful)', async () => {
      mockClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      const result = await service.logout('some-token');

      expect(result.success).toBe(true);
    });
  });

  // ─── GET PROFILE ─────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns user profile for valid authId', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        phone: '1234567890',
        avatar: null,
        role: 'USER',
      });

      const result = await service.getProfile('auth-1');

      expect(result.email).toBe('test@example.com');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { authId: 'auth-1' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
        },
      });
    });

    it('throws UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── FORGOT PASSWORD ────────────────────────────────────────

  describe('forgotPassword', () => {
    it('always returns success to prevent email enumeration', async () => {
      mockClient.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('If an account with that email exists');
    });

    it('returns success even on error to prevent enumeration', async () => {
      mockClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Rate limited' },
      });

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('If an account with that email exists');
    });
  });

  // ─── SYNC OAUTH USER ────────────────────────────────────────

  describe('syncOAuthUser', () => {
    it('creates a new user on first OAuth login', async () => {
      mockClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'oauth-auth-id',
            email: 'oauth@example.com',
            user_metadata: {
              full_name: 'OAuth User',
              avatar_url: 'https://avatar.jpg',
            },
          },
        },
        error: null,
      });
      prisma.user.findUnique
        .mockResolvedValueOnce(null) // No user by authId
        .mockResolvedValueOnce(null); // No user by email
      prisma.user.create.mockResolvedValue({
        id: 'new-oauth-user',
        email: 'oauth@example.com',
        name: 'OAuth User',
        phone: null,
        avatar: 'https://avatar.jpg',
        role: 'USER',
      });

      const result = await service.syncOAuthUser('oauth-token');

      expect(result.user.email).toBe('oauth@example.com');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('throws UnauthorizedException on invalid OAuth token', async () => {
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await expect(service.syncOAuthUser('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
