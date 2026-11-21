import type { Locator, Page } from '@playwright/test';

/** Admin Messages page (/admin/message): guest messages and the message viewer. */
export class MessagesPage {
  readonly viewer: Locator;

  constructor(private readonly page: Page) {
    this.viewer = page.getByRole('dialog');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/message');
    await this.page.waitForResponse((r) => r.url().endsWith('/api/message') && r.request().method() === 'GET');
  }

  row(subject: string): Locator {
    return this.page.locator('.messages .row.detail').filter({ hasText: subject });
  }

  async open(subject: string): Promise<void> {
    await this.row(subject).locator('p').first().click();
  }
}
