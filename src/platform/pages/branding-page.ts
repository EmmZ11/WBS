import type { Locator, Page } from '@playwright/test';

/** Admin Branding page (/admin/branding): the B&B's public details. */
export class BrandingPage {
  readonly name: Locator;
  readonly logoUrl: Locator;
  readonly contactEmail: Locator;
  readonly contactPhone: Locator;
  readonly postCode: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByPlaceholder('Enter B&B name');
    this.logoUrl = page.getByPlaceholder('Enter image url');
    this.contactEmail = page.getByPlaceholder('Enter Email Address');
    this.contactPhone = page.getByPlaceholder('Enter Phone Number');
    this.postCode = page.getByPlaceholder('Enter Post Code');
    this.submit = page.getByRole('button', { name: 'Submit' });
    // The error box is a plain .alert div (the page's role="alert" element is Next.js's route announcer).
    this.error = page.locator('.alert').filter({ hasText: /\S/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/branding');
    // The form is filled from GET /api/branding after load.
    await this.page.waitForResponse((r) => r.url().endsWith('/api/branding') && r.request().method() === 'GET');
  }
}
