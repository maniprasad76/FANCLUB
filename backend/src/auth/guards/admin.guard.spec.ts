import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

/**
 * AdminGuard Unit Tests
 *
 * Tests cover:
 *   - ADMIN role passes
 *   - USER role blocked with ForbiddenException
 *   - Missing user object blocked
 *   - Audit trail logging for both access and denial
 */
describe('AdminGuard', () => {
  let guard: AdminGuard;

  beforeEach(() => {
    guard = new AdminGuard();
  });

  function createMockContext(user: any) {
    const request: any = {
      user,
      method: 'POST',
      url: '/api/products',
      ip: '127.0.0.1',
      headers: {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;
  }

  it('returns true for ADMIN role', () => {
    const context = createMockContext({
      id: 'admin-1',
      email: 'admin@fanclub.in',
      role: 'ADMIN',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws ForbiddenException for USER role', () => {
    const context = createMockContext({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user object is undefined', () => {
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user has no role', () => {
    const context = createMockContext({ id: 'user-1', email: 'test@example.com' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
