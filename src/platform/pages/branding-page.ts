import type { Locator, Page } from '@playwright/test';

/** Admin Branding page (/admin/branding): the B&B's public details. */
export class BrandingPage {
  readonly name: Locator;
  readonly logoUrl: Locator;
  readonly contactEmail: Locator;
  readonly postCode: Locator;
  readonly submit: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByPlaceholder('Enter B&B name');
    this.logoUrl = page.getByPlaceholder('Enter image url');
    this.contactEmail = page.getByPlaceholder('Enter Email Address');
    this.postCode = page.getByPlaceholder('Enter Post Code');
    this.submit = page.getByRole('button', { name: 'Submit' });
    // Error box is a .alert div. getByRole('alert') would also match Next.js's empty route announcer.
    this.error = page.locator('.alert').filter({ hasText: /\S/ });
  }

  /** Opens the page and waits for the form to be filled from GET /api/branding. */
  async goto(): Promise<void> {
    // Start waiting before navigating, so a fast response is not missed.
    await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/api/branding') && r.request().method() === 'GET'),
      this.page.goto('/admin/branding'),
    ]);
  }
}
