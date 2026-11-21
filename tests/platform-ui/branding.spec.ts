import { expect, test } from '../../src/fixtures';
import { BrandingPage } from '../../src/platform/pages/branding-page';

// Branding is shared site-wide data: these tests submit it unchanged, or with an
// invalid value the API refuses, so the live branding is never altered.
test.describe('Platform UI: branding', () => {
  test('the form shows the branding stored in the API', async ({ page, adminApi }) => {
    const branding = new BrandingPage(page);
    const stored = await (await adminApi.getBranding()).json();
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
    const branding = new BrandingPage(page);
    await branding.goto();
    await branding.logoUrl.fill('https://example.com/logo.png');
    await branding.contactEmail.fill('not-an-email');
    await branding.submit.click();
    await expect(branding.error, 'the error should point at the email field').toContainText(/email/i);
  });
});
