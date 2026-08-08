import {
  test,
  expect,
  Page,
  APIRequestContext,
  request as playwrightRequest,
} from '@playwright/test';

/**
 * Full storefront journey tests: Browse → Wishlist → Cart → Checkout →
 * Order Success → Order Tracking, plus the Cmd+K search palette and reviews.
 *
 * Environment-agnostic: products are discovered from the API (no dependency
 * on seed data), and a fresh user is signed up per test.
 *
 * PREREQUISITES:
 *  - Backend API reachable at E2E_API_URL (default http://localhost:3001/api)
 *    with at least one in-stock product and COD_ENABLED=true.
 *  - E2E_SUPABASE_URL + E2E_SUPABASE_SERVICE_ROLE_KEY: same Supabase project
 *    the backend uses — needed to auto-confirm freshly-registered emails
 *    (the backend issues no session at signup until the email is verified).
 *  - Local runs: frontend dev server on :5173 (handled by playwright.config).
 *  - Staging/prod runs:
 *      PLAYWRIGHT_BASE_URL=https://your-frontend \
 *      E2E_API_URL=https://your-backend/api \
 *      E2E_SUPABASE_URL=... E2E_SUPABASE_SERVICE_ROLE_KEY=... \
 *      npx playwright test tests/e2e-flow.spec.ts
 *
 * NOTE: running against a shared environment creates test users, orders,
 * reviews and wishlist items there.
 */

const API_BASE = (process.env.E2E_API_URL || 'http://localhost:3001/api').trim();

/**
 * Confirm a freshly-registered user's email via the Supabase Admin API.
 * The backend issues NO session at signup (email confirmation required),
 * so tests confirm the address and then sign in for a real session.
 *
 * Requires E2E_SUPABASE_URL + E2E_SUPABASE_SERVICE_ROLE_KEY (the same
 * project the backend is wired to). Returns the confirmed user's id.
 */
async function confirmUserEmail(request: APIRequestContext, email: string): Promise<string> {
  const sbUrl = process.env.E2E_SUPABASE_URL?.trim();
  const sbKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim();
  expect(sbUrl && sbKey, 'set E2E_SUPABASE_URL + E2E_SUPABASE_SERVICE_ROLE_KEY to confirm test users').toBeTruthy();
  const base = sbUrl!.replace(/\/$/, '');

  // Use a standalone Node context, NOT the page-scoped `request` fixture:
  // Supabase refuses secret (service_role) keys from browser-like requests,
  // and the page fixture inherits the browser user agent. The service-role
  // key doubles as both the `apikey` header and the admin Bearer token.
  const adminCtx = await playwrightRequest.newContext({
    baseURL: base,
    extraHTTPHeaders: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
    },
    userAgent: 'fanclub-e2e-admin',
  });
  try {
    const list = await adminCtx.get(
      `/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    );
    expect(
      list.ok(),
      `supabase user lookup failed: ${list.status()} ${await list.text()}`,
    ).toBeTruthy();
    const { users } = await list.json();
    const target = (users || []).find(
      (u: any) => u.email === email.toLowerCase(),
    );
    expect(target, `supabase user not found for ${email}`).toBeTruthy();

    const confirm = await adminCtx.put(
      `/auth/v1/admin/users/${target.id}`,
      { data: { email_confirm: true } },
    );
    expect(
      confirm.ok(),
      `email confirm failed: ${confirm.status()} ${await confirm.text()}`,
    ).toBeTruthy();
    return target.id;
  } finally {
    await adminCtx.dispose();
  }
}

/** Fresh unique user per test — signup → confirm email → sign in → seed the browser session. */
async function createSignedInUser(request: APIRequestContext, page: Page) {
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@fanclub.test`;
  const password = 'E2E-Pass-1234';
  const name = 'E2E Shopper';

  const res = await request.post(`${API_BASE}/auth/signup`, {
    data: { email, password, name },
  });
  expect(res.ok(), `signup failed: ${res.status()} ${await res.text()}`).toBeTruthy();

  // Backend returns { message } — no session until the email is confirmed.
  // In dev (confirmation disabled) signup may already return a session; in
  // that case skip the admin confirmation + signin round trip.
  let body: any = await res.json();
  let user = body.user;
  let access = body.session?.access_token;
  let refresh = body.session?.refresh_token;

  if (!access) {
    await confirmUserEmail(request, email);
    const signin = await request.post(`${API_BASE}/auth/signin`, {
      data: { email, password },
    });
    expect(signin.ok(), `signin failed: ${signin.status()} ${await signin.text()}`).toBeTruthy();
    body = await signin.json();
    user = body.user;
    access = body.session?.access_token;
    refresh = body.session?.refresh_token;
  }

  expect(user, 'signup response missing user').toBeTruthy();
  expect(access, 'signup response missing access_token').toBeTruthy();

  // Seed the SPA session before any page loads
  await page.addInitScript(
    ({ u, a, r }) => {
      sessionStorage.setItem('user', JSON.stringify(u));
      sessionStorage.setItem('access_token', a);
      sessionStorage.setItem('refresh_token', r || '');
      // Skip brand intro overlay for faster, stable tests
      sessionStorage.setItem('fan_intro_shown', '1');
    },
    { u: user, a: access, r: refresh },
  );

  return { user, access, refresh };
}

/** Pick the first in-stock, active product from the API (no seed assumptions). */
async function getHealthyProduct(request: APIRequestContext) {
  const res = await request.get(`${API_BASE}/products?limit=20`);
  expect(res.ok(), `products fetch failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  const data = await res.json();
  const products: any[] = data.products || [];
  expect(products.length, 'no products available on this environment').toBeGreaterThan(0);

  const healthy =
    products.find((p) => Number(p.stock) > 0 && p.isActive !== false) ||
    products[0];
  return { slug: healthy.slug, name: healthy.name };
}

async function createAddress(request: APIRequestContext, access: string) {
  const res = await request.post(`${API_BASE}/users/me/addresses`, {
    headers: { Authorization: `Bearer ${access}` },
    data: {
      name: 'E2E Tester',
      phone: '9876543210',
      street: '42 Test Street, Fandom Nagar',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500001',
      isDefault: true,
    },
  });
  expect(res.ok(), `address create failed: ${res.status()} ${await res.text()}`).toBeTruthy();
  return res.json();
}

const isMac = process.platform === 'darwin';

test.describe('FANCLUB storefront journey', () => {
  test.setTimeout(120_000);

  test('Cmd+K opens the search palette with quick filters and keyboard navigation', async ({ page, request }) => {
    const { name } = await getHealthyProduct(request);
    await page.goto('/');

    // Wait for the app to hydrate before sending the shortcut (the global
    // keydown listener only exists after React mounts).
    await expect(page.locator('#nav-search-btn')).toBeVisible({ timeout: 15_000 });

    // Cmd/Ctrl+K opens the palette
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    await expect(page.locator('#search-input')).toBeVisible({ timeout: 10_000 });

    // Empty state shows quick filters (categories + trending chips)
    await expect(page.locator('.search-group-label').first()).toBeVisible();
    await expect(page.locator('.search-chip').first()).toBeVisible();

    // Type a real product name → debounced live results with prices
    await page.locator('#search-input').fill(name);
    await expect(page.locator('.search-result-item').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.search-result-price').first()).toBeVisible();

    // Arrow keys highlight, Enter opens the product
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.search-result-item.highlighted')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/product\//, { timeout: 10_000 });

    // Escape closes from the product page
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    await expect(page.locator('#search-input')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-input')).not.toBeVisible();
  });

  test('browse → wishlist → cart → checkout (COD) → order success → tracking', async ({ page, request }) => {
    const { access } = await createSignedInUser(request, page);
    await createAddress(request, access);
    const { slug, name } = await getHealthyProduct(request);

    // ── Browse: shop grid renders, then open a healthy product ──
    await page.goto('/shop');
    await expect(page.locator('.product-grid .shop-product-item').first()).toBeVisible({
      timeout: 20_000,
    });
    await page.goto(`/product/${slug}`);
    await expect(page).toHaveURL(/\/product\//, { timeout: 10_000 });
    await expect(page.locator('.pdp-title').first()).toBeVisible();

    // ── Wishlist: click heart, wait for the API call, then check the list ──
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/wishlist/') && r.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.locator('.btn-wishlist-neo').first().click(),
    ]);
    await page.goto('/wishlist');
    await expect(page.locator('body')).toContainText(name, { timeout: 15_000 });

    // ── Cart: add from the product page, verify in /cart ──
    await page.goto(`/product/${slug}`);
    await expect(page.locator('.btn-add-to-cart').first()).toBeVisible({ timeout: 10_000 });
    await page.locator('.btn-add-to-cart').first().click();
    await expect(page.locator('.btn-add-to-cart').first()).toContainText('Added to Bag', {
      timeout: 20_000,
    });
    await page.goto('/cart');
    await expect(page.locator('body')).toContainText(name, { timeout: 15_000 });

    // ── Checkout (COD is the default payment method) ──
    await page.goto('/checkout');
    await expect(page.locator('#place-order-btn')).toBeVisible({ timeout: 20_000 });
    await page.locator('.address-option').first().click();
    await page.locator('#place-order-btn').click();

    // ── Order Success ──
    await page.waitForURL(/\/order-success/, { timeout: 40_000 });
    await expect(page.locator('.success-title')).toContainText('Thank', { timeout: 10_000 });

    // ── Order Tracking: visual timeline ──
    const trackLink = page.locator('a[href^="/orders/"]').first();
    await expect(trackLink).toBeVisible();
    await trackLink.click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 10_000 });
    await expect(page.locator('#order-tracking-page')).toBeVisible();
    await expect(page.locator('.ot-timeline')).toBeVisible();
    await expect(page.locator('.ot-step')).toHaveCount(5); // Placed→Confirmed→Processing→Shipped→Delivered
    await expect(page.locator('.ot-eta')).toBeVisible();
    await expect(page.locator('.ot-badge')).toBeVisible();
  });

  test('product reviews render filters, verified logic and the review form', async ({ page, request }) => {
    await createSignedInUser(request, page);
    const { slug } = await getHealthyProduct(request);
    await page.goto(`/product/${slug}`);

    const reviewsSection = page.locator('#reviews-section');
    await expect(reviewsSection).toBeVisible({ timeout: 20_000 });

    // Review form opens for signed-in users
    await page.getByRole('button', { name: /Write a Review/i }).first().click();
    await expect(page.locator('.pr-form')).toBeVisible();
    await expect(page.locator('.pr-upload-zone')).toBeVisible(); // photo upload
    await page.locator('.pr-form-stars svg').nth(3).click(); // 4 stars
    await page.locator('.pr-textarea').fill('Great fit and print quality!');
    await page.getByRole('button', { name: /Submit Review/i }).click();

    // After submit, the review appears in the list (rating filter chips render too)
    await expect(reviewsSection.locator('.pr-card').first()).toBeVisible({ timeout: 20_000 });
    await expect(reviewsSection.locator('.pr-card').first()).toContainText('Great fit and print quality!');
    await expect(reviewsSection.locator('.pr-filter-chip').first()).toBeVisible();
  });
});
