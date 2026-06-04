/**
 * Shared TypeScript interfaces for the Auth module.
 * Replaces all `any` return types with explicit, documented types.
 */

/** Public user profile — returned by all auth endpoints */
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
}

/** Session tokens — returned after login, register, refresh */
export interface SessionTokens {
  access_token: string;
  refresh_token?: string;
}

/** Auth result — login/register/refresh response */
export interface AuthResult {
  user: UserProfile;
  session: SessionTokens;
}

/** Sign-up result — session may be null if auto-login fails */
export interface SignUpResult {
  user: UserProfile;
  session: SessionTokens | null;
}

/** OAuth sync result — only returns access_token (no refresh) */
export interface OAuthSyncResult {
  user: UserProfile;
  session: { access_token: string } | null;
}

/** Forgot password result */
export interface ForgotPasswordResult {
  message: string;
}

/** Logout result */
export interface LogoutResult {
  success: boolean;
}
