import { expect, test } from '../../src/fixtures';
import { adminCredentials } from '../../src/config';
import { LoginPage } from '../../src/platform/pages/login-page';

// These tests exercise the login form itself, so they start without a session.
// A failure report must never contain the credentials typed into the form: screenshots
// are off here, and after a failure the fields are cleared before the page snapshot
// that Playwright attaches (verified: the snapshot is taken after this hook).
test.use({ storageState: { cookies: [], origins: [] }, screenshot: 'off' });

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const login = new LoginPage(page);
  for (const field of [login.username, login.password]) {
    if (await field.isVisible()) await field.clear();
  }
});

test.describe('Platform UI: admin login', () => {
  test('valid credentials open the admin area', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    const { username, password } = adminCredentials();
    await login.login(username, password);
    await expect(page).toHaveURL(/\/admin\/rooms/);
  });

  test('invalid credentials show an error and stay on the login page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('not-a-user', 'not-a-password');
    await expect(login.error).toHaveText('Invalid credentials');
    await expect(page).toHaveURL(/\/admin$/);
  });

  test('password input is masked', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.password).toHaveAttribute('type', 'password');
  });

  test('Logout is not offered before logging in', { annotation: { type: 'bug', description: 'RBP-04' } }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.logout, 'RBP-04: Logout should not be offered before login').toBeHidden();
  });

  test('admin pages show the login form when not logged in', async ({ page }) => {
    await page.goto('/admin/rooms');
    // The login form rendering at the rooms URL is the evidence; the list must not be there.
    await expect(new LoginPage(page).submit).toBeVisible();
    await expect(page.getByTestId('roomlisting')).toHaveCount(0);
  });

  test('logout ends the session in the browser', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    const { username, password } = adminCredentials();
    await login.login(username, password);
    await expect(page).toHaveURL(/\/admin\/rooms/);
    await login.logout.click();
    // Logout navigates to the front page; wait for it so the next navigation does not race it.
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/admin/rooms');
    await expect(login.submit).toBeVisible();
  });

  test('the session cookie is protected from scripts and plain HTTP', { annotation: { type: 'bug', description: 'RBP-13' } }, async ({ page, context }) => {
    // OWASP A05 (security misconfiguration): a session token should be HttpOnly and Secure.
    const login = new LoginPage(page);
    await login.goto();
    const { username, password } = adminCredentials();
    await login.login(username, password);
    await expect(page).toHaveURL(/\/admin\/rooms/);
    const cookie = (await context.cookies()).find((c) => c.name === 'token');
    expect(cookie, 'login should set a token cookie').toBeDefined();
    expect.soft(cookie?.httpOnly, 'RBP-13: token cookie is readable by page scripts (not HttpOnly)').toBe(true);
    expect.soft(cookie?.secure, 'RBP-13: token cookie can be sent over plain HTTP (not Secure)').toBe(true);
  });
});
