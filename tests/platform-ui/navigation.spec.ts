import { expect, test } from '../../src/fixtures';
import { AdminNav } from '../../src/platform/pages/admin-nav';

// After login the admin moves between four areas. Each link must land on its page.
test.describe('Platform UI: admin navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/rooms');
  });

  for (const [area, path] of [
    ['report', /\/admin\/report$/],
    ['branding', /\/admin\/branding$/],
    ['messages', /\/admin\/message$/],
    ['rooms', /\/admin\/rooms$/],
  ] as const) {
    test(`the ${area} link opens the ${area} page`, async ({ page }) => {
      const nav = new AdminNav(page);
      await nav[area].click();
      await expect(page).toHaveURL(path);
    });
  }
});
