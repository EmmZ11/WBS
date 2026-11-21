import { expect, test } from '../../src/fixtures';

// Branding is shared, site-wide data. These tests only ever send back the
// current branding (unchanged) or an invalid copy the API must refuse.
test.describe('Platform API: branding (admin)', () => {
  test('branding can be read and has the fields the admin form shows', async ({ adminApi }) => {
    const response = await adminApi.getBranding();
    expect(response.status()).toBe(200);
    const branding = await response.json();
    expect(Object.keys(branding)).toEqual(
      expect.arrayContaining(['name', 'logoUrl', 'description', 'map', 'contact', 'address']),
    );
  });

  test('saving the current branding unchanged succeeds', { annotation: { type: 'bug', description: 'RBP-10' } }, async ({ adminApi }) => {
    const current = await (await adminApi.getBranding()).json();
    const response = await adminApi.updateBranding(current);
    expect(response.status(), `RBP-10: the site's own branding (logoUrl "${current.logoUrl}") should save`).toBe(200);
  });

  test('an invalid email is refused without exposing server internals', { annotation: { type: 'bug', description: 'RBP-11' } }, async ({ adminApi }) => {
    const current = await (await adminApi.getBranding()).json();
    const response = await adminApi.updateBranding({ ...current, contact: { ...current.contact, email: 'not-an-email' } });
    expect(response.status()).toBe(400);
    expect(await response.text(), 'RBP-11: error should not reveal Java class or method names').not.toMatch(/org\.springframework|com\.automationintesting|java\./);
  });
});
