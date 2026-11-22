import { expect, test } from '../../src/fixtures';
import { AdminNav } from '../../src/platform/pages/admin-nav';

// After login the admin moves between four areas. Each test starts on a different
// page from its target, so the click is what changes the page.
test.describe('Platform UI: admin navigation', () => {
  for (const { area, from, to } of [
    { area: 'report', from: '/admin/rooms', to: /\/admin\/report$/ },
    { area: 'branding', from: '/admin/rooms', to: /\/admin\/branding$/ },
    { area: 'messages', from: '/admin/rooms', to: /\/admin\/message$/ },
    { area: 'rooms', from: '/admin/report', to: /\/admin\/rooms$/ },
  ] as const) {
    test(`the ${area} link opens the ${area} page`, async ({ page }) => {
      await page.goto(from);
      await new AdminNav(page)[area].click();
      await expect(page).toHaveURL(to);
    });
  }
});
