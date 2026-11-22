import { expect, type Locator, type Page } from '@playwright/test';

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
    // Error box is a .alert div. getByRole('alert') would also match Next.js's empty route announcer.
    this.error = page.locator('.alert').filter({ hasText: /\S/ });
    this.logout = page.getByRole('button', { name: 'Logout' });
  }

  /** Opens /admin and waits until the login form is ready to use. */
  async goto(): Promise<void> {
    await this.page.goto('/admin');
    await expect(this.submit).toBeVisible();
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
 * This sets the value the way typing does (native setter + input event, which React
 * listens for), so the report only shows an "Evaluate" step.
 */
async function enterSecret(field: Locator, value: string): Promise<void> {
  // evaluate() skips Playwright's actionability checks, so wait for an editable field first.
  await expect(field).toBeEditable();
  await field.evaluate((element, secret) => {
    const input = element as HTMLInputElement;
    // The native setter is called with the input as `this` on the next line, which is the point.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setValue?.call(input, secret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect(field).not.toHaveValue('');
}
