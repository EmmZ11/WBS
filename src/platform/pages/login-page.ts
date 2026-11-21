import type { Locator, Page } from '@playwright/test';

/** Admin login form at /admin. Locators use roles and labels, as a user would. */
export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly logout: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.submit = page.getByRole('button', { name: 'Login' });
    this.error = page.getByRole('alert').filter({ hasText: /\S/ });
    this.logout = page.getByRole('button', { name: 'Logout' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin');
  }

  async login(username: string, password: string): Promise<void> {
    await enterSecret(this.username, username);
    await enterSecret(this.password, password);
    await this.submit.click();
  }
}

/**
 * Enters a value without it appearing in the HTML report. fill() and keyboard input
 * write the value into the step title ("Fill \"…\""), which would publish credentials.
 * This sets the value the way a typed input does (native setter + input event, which
 * React listens for), so the report only shows an "Evaluate" step.
 */
async function enterSecret(field: Locator, value: string): Promise<void> {
  await field.evaluate((element, secret) => {
    const input = element as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(input, secret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}
