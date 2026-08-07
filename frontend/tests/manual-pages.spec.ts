import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const FE = 'http://localhost:5173';
const AD = 'http://localhost:5174';

// ── Admin credentials read from backend/.env (never printed) ──
function getAdminCreds(): { email: string; password: string } | null {
  try {
    const envPath = path.resolve(__dirname, '../../backend/.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    const get = (k: string) => {
      const m = raw.split(/\r?\n/).find((l) => l.trim().startsWith(`${k}=`));
      if (!m) return undefined;
      return m.slice(m.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    };
    const email = get('ADMIN_EMAIL');
    const password = get('ADMIN_PASSWORD');
    return email && password ? { email, password } : null;
  } catch {
    return null;
  }
}

// ── Helpers to collect console errors + failed requests ──
function watchPage(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('requestfailed', (req) => {
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText}`);
  });
  return { consoleErrors, pageErrors, failedRequests };
}

const paceDelay = Number(process.env.PACE_MS || 5000); // ms between page visits to respect API rate limits

async function visit(page: Page, url: string, waitFor = 4000) {
  const watchers = watchPage(page);
  const status: any = { url, status: 'OK', heading: '', notes: [] };
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    status.httpStatus = resp ? resp.status() : 'n/a';
    await page.waitForTimeout(waitFor);
    status.title = await page.title().catch(() => '');
    // Grab first visible h1/h2 as a heading
    const h = page.locator('h1, h2').first();
    if (await h.isVisible().catch(() => false)) status.heading = (await h.textContent().catch(() => '') || '').trim().slice(0, 80);
    // Detect common empty/error markers
    const bodyText = (await page.locator('body').innerText().catch(() => '')) || '';
    if (/something went wrong|error boundary|failed to load|not found|server error/i.test(bodyText) && bodyText.length < 600) {
      status.status = 'ERROR_STATE';
      status.notes.push('error-state text on page');
    }
    if (bodyText.trim().length < 40) {
      status.status = 'BLANK';
      status.notes.push('near-empty body');
    }
  } catch (e: any) {
    status.status = 'FAILED_TO_LOAD';
    status.notes.push(e.message?.slice(0, 120));
  }
  status.consoleErrors = watchers.consoleErrors.slice(0, 8);
  status.pageErrors = watchers.pageErrors.slice(0, 5);
  status.failedRequests = watchers.failedRequests.slice(0, 8);
  return status;
}

test.describe('Full page walk', () => {
  test.setTimeout(300000);

  test('frontend: every page', async ({ page }) => {
    const results: any[] = [];
    const feRoutes = [
      ['/', 'Home'],
      ['/shop', 'Shop'],
      ['/cart', 'Cart'],
      ['/login', 'Login'],
      ['/register', 'Register'],
      ['/forgot-password', 'ForgotPassword'],
      ['/reset-password', 'ResetPassword'],
      ['/fandom', 'Fandom'],
      ['/contact', 'Contact'],
      ['/about', 'About'],
      ['/faq', 'FAQ'],
      ['/privacy', 'Privacy'],
      ['/returns', 'Returns'],
      ['/terms', 'Terms'],
      ['/access-denied', 'AccessDenied'],
      ['/launch-checklist', 'LaunchChecklist'],
      ['/nonexistent-page-xyz', 'NotFound'],
      // Protected routes — should redirect to /login when logged out
      ['/checkout', 'Checkout(protected)'],
      ['/wishlist', 'Wishlist(protected)'],
      ['/profile', 'Profile(protected)'],
      ['/loyalty', 'Loyalty(protected)'],
    ];
    for (const [route, label] of feRoutes) {
      const r = await visit(page, FE + route, 3500);
      r.label = label;
      results.push(r);
      await page.waitForTimeout(paceDelay);
    }
    // Product detail: discover a real product slug if the shop loaded any
    try {
      await page.goto(FE + '/shop', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      const link = page.locator('a[href*="/product/"]').first();
      if (await link.isVisible().catch(() => false)) {
        const href = await link.getAttribute('href');
        if (href) {
          const r = await visit(page, FE + href, 3500);
          r.label = 'ProductDetail';
          results.push(r);
        }
      } else {
        results.push({ url: FE + '/product/:slug', label: 'ProductDetail', status: 'NO_PRODUCTS_FOUND', notes: ['no product cards rendered on /shop'] });
      }
    } catch {
      results.push({ url: FE + '/product/:slug', label: 'ProductDetail', status: 'NO_PRODUCTS_FOUND', notes: ['could not reach /shop'] });
    }
    console.log('FRONTEND_RESULTS=' + JSON.stringify(results, null, 2));
  });

  test('admin: login page + all pages', async ({ page }) => {
    test.setTimeout(300000);
    const results: any[] = [];
    const creds = getAdminCreds();

    // Login page renders
    results.push(await visit(page, AD + '/login', 2500).then((r) => ({ ...r, label: 'LoginPage' })));

    if (!creds) {
      results.push({ url: AD, label: 'ALL_ADMIN_PAGES', status: 'NO_CREDS', notes: ['backend/.env ADMIN_EMAIL/PASSWORD missing — cannot log in'] });
    } else {
      // Attempt login
      try {
        await page.goto(AD + '/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
        await page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first().fill(creds.email);
        await page.getByLabel(/password/i).or(page.locator('input[type="password"]')).first().fill(creds.password);
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(5000);
        const urlAfter = page.url();
        results.push({ url: AD + '/login', label: 'LoginSubmit', status: urlAfter.includes('/login') ? 'LOGIN_FAILED' : 'LOGIN_OK', notes: [`final URL: ${urlAfter}`] });

        if (urlAfter.includes('/login')) {
          results.push({ url: AD, label: 'ALL_ADMIN_PAGES', status: 'SKIPPED', notes: ['login failed — cannot access admin pages'] });
        } else {
          const adminRoutes: [string, string][] = [
            ['/', 'Dashboard'],
            ['/products', 'Products'],
            ['/products/new', 'ProductFormNew'],
            ['/categories', 'Categories'],
            ['/orders', 'Orders'],
            ['/payments', 'Payments'],
            ['/customers', 'Customers'],
            ['/reviews', 'Reviews'],
            ['/newsletter', 'Newsletter'],
            ['/contacts', 'Contacts'],
            ['/audit-logs', 'AuditLogs'],
            ['/settings', 'Settings'],
            ['/coupons', 'Coupons'],
            ['/loyalty', 'LoyaltyAdmin'],
          ];
          for (const [route, label] of adminRoutes) {
            const r = await visit(page, AD + route, 4000);
            r.label = label;
            results.push(r);
            await page.waitForTimeout(paceDelay);
          }
        }
      } catch (e: any) {
        results.push({ url: AD + '/login', label: 'LoginSubmit', status: 'FAILED_TO_LOAD', notes: [e.message?.slice(0, 120)] });
      }
    }
    console.log('ADMIN_RESULTS=' + JSON.stringify(results, null, 2));
  });
});
