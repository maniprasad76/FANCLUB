import { test, expect } from '@playwright/test';

test.describe('FAN Storefront E2E', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FANCLUB/);
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/FANCLUB/);
    await expect(page.locator('button[type="submit"]').first()).toBeVisible({ timeout: 10000 });
  });
});
