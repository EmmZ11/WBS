import { expect, test } from '../../src/fixtures';
import { BrandingPage } from '../../src/platform/pages/branding-page';

// Branding is shared site-wide data. These tests submit it unchanged, or with an
// invalid email the API refuses (checked first in the API suite), so the live
// branding is not altered.
test.describe('Platform UI: branding', () => {
  test('the form shows the branding stored in the API', async ({ page, adminApi }) => {
    const branding = new BrandingPage(page);
    const stored = await adminApi.readBranding();
    await branding.goto();
    await expect(branding.name).toHaveValue(stored.name);
    await expect(branding.contactEmail).toHaveValue(stored.contact.email);
    await expect(branding.postCode).toHaveValue(stored.address.postCode);
  });

  test('submitting the form unchanged saves', { annotation: { type: 'bug', description: 'RBP-10' } }, async ({ page }) => {
    const branding = new BrandingPage(page);
    await branding.goto();
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/branding') && r.request().method() === 'PUT');
    await branding.submit.click();
    const response = await saved;
    expect(response.status(), 'RBP-10: the unchanged form is refused ("Url should be a correct url format")').toBe(200);
  });

  test('an invalid email is refused with a message about the email field', async ({ page }) => {
    // Risk accepted and documented: this sends a full logo URL so only the email is
    // invalid. If email validation ever regressed, that logo would be saved.
    const branding = new BrandingPage(page);
    await branding.goto();
    await branding.logoUrl.fill('https://example.com/logo.png');
    await branding.contactEmail.fill('not-an-email');
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/branding') && r.request().method() === 'PUT');
    await branding.submit.click();
    expect((await saved).status(), 'the invalid email should be refused').toBe(400);
    await expect(branding.error, 'the error should point at the email field').toContainText(/email/i);
  });
});
