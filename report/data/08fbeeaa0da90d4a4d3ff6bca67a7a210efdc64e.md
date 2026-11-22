# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: platform-api/branding.spec.ts >> Platform API: branding (admin) >> saving the current branding unchanged succeeds
- Location: tests/platform-api/branding.spec.ts:14:3

# Error details

```
Error: RBP-10: the site's own branding (logoUrl "/images/rbp-logo.jpg") should save

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Test source

```ts
  1  | import { expect, test } from '../../src/fixtures';
  2  | 
  3  | // Branding is shared, site-wide data. These tests only ever send back the current
  4  | // branding unchanged, or a copy with an invalid email that the API must refuse.
  5  | test.describe('Platform API: branding (admin)', () => {
  6  |   test('branding can be read and has the fields the admin form shows', async ({ adminApi }) => {
  7  |     const response = await adminApi.getBranding();
  8  |     expect(response.status()).toBe(200);
  9  |     expect(Object.keys(await adminApi.readBranding())).toEqual(
  10 |       expect.arrayContaining(['name', 'logoUrl', 'description', 'map', 'contact', 'address']),
  11 |     );
  12 |   });
  13 | 
  14 |   test('saving the current branding unchanged succeeds', { annotation: { type: 'bug', description: 'RBP-10' } }, async ({ adminApi }) => {
  15 |     const current = await adminApi.readBranding();
  16 |     const response = await adminApi.updateBranding(current);
> 17 |     expect(response.status(), `RBP-10: the site's own branding (logoUrl "${current.logoUrl}") should save`).toBe(200);
     |                                                                                                             ^ Error: RBP-10: the site's own branding (logoUrl "/images/rbp-logo.jpg") should save
  18 |   });
  19 | 
  20 |   test('an invalid email is refused, naming the email field', async ({ adminApi }) => {
  21 |     const current = await adminApi.readBranding();
  22 |     // A full logo URL, so the only invalid value is the email (the site's own logo fails, RBP-10).
  23 |     const response = await adminApi.updateBranding({
  24 |       ...current, logoUrl: 'https://example.com/logo.png', contact: { ...current.contact, email: 'not-an-email' },
  25 |     });
  26 |     expect(response.status()).toBe(400);
  27 |     expect(await response.text(), 'the error should be about the email field').toMatch(/email/i);
  28 |   });
  29 | 
  30 |   test('validation errors do not expose server internals', { annotation: { type: 'bug', description: 'RBP-11' } }, async ({ adminApi }) => {
  31 |     const current = await adminApi.readBranding();
  32 |     const response = await adminApi.updateBranding({
  33 |       ...current, logoUrl: 'https://example.com/logo.png', contact: { ...current.contact, email: 'not-an-email' },
  34 |     });
  35 |     expect(response.status()).toBe(400);
  36 |     expect(await response.text(), 'RBP-11: error should not reveal Java class or method names').not.toMatch(/org\.springframework|com\.automationintesting|java\./);
  37 |   });
  38 | });
  39 | 
```