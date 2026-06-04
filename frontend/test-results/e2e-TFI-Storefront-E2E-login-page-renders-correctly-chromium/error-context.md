# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.ts >> FAN Storefront E2E >> login page renders correctly
- Location: tests\e2e.spec.ts:9:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button[type="submit"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('button[type="submit"]').first()

```

```yaml
- text: "ENOENT: no such file or directory, open 'C:\\Users\\manip\\Desktop\\FAN\\frontend\\node_modules\\@vitejs\\plugin-react-swc\\refresh-runtime.js' at readFileSync (node:fs:448:20) at LoadPluginContext.handler (file:///C:/Users/manip/Desktop/FAN/frontend/node_modules/@vitejs/plugin-react-swc/index.js:104:49) at EnvironmentPluginContainer.load (file:///C:/Users/manip/Desktop/FAN/frontend/node_modules/vite/dist/node/chunks/node.js:30101:56) at process.processTicksAndRejections (node:internal/process/task_queues:95:5) at async loadAndTransform (file:///C:/Users/manip/Desktop/FAN/frontend/node_modules/vite/dist/node/chunks/node.js:24421:21) at async viteTransformMiddleware (file:///C:/Users/manip/Desktop/FAN/frontend/node_modules/vite/dist/node/chunks/node.js:24262:20) Click outside, press Esc key, or fix the code to dismiss. You can also disable this overlay by setting"
- code: server.hmr.overlay
- text: to
- code: "false"
- text: in
- code: vite.config.ts
- text: .
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('FAN Storefront E2E', () => {
  4  |   test('homepage loads successfully', async ({ page }) => {
  5  |     await page.goto('/');
  6  |     await expect(page).toHaveTitle(/FANCLUB/);
  7  |   });
  8  | 
  9  |   test('login page renders correctly', async ({ page }) => {
  10 |     await page.goto('/login');
  11 |     await expect(page).toHaveTitle(/FANCLUB/);
> 12 |     await expect(page.locator('button[type="submit"]').first()).toBeVisible({ timeout: 10000 });
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  13 |   });
  14 | });
  15 | 
```