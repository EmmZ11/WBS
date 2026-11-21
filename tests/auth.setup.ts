import { expect, test as setup } from '@playwright/test';
import { PlatformApi } from '../src/platform/platform-api';
import { ADMIN_STATE, BASE_URL, adminCredentials } from '../src/config';

// Log in once through the API (fast and stable) and save the session.
// The API returns the token in the body; the admin UI stores it in a "token"
// cookie, so we store it the same way. UI and API tests reuse this session;
// only the login tests themselves go through the login form.
setup('authenticate as admin', async ({ request, context }) => {
  const { username, password } = adminCredentials();
  const response = await new PlatformApi(request).login(username, password);
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  expect(token, 'login should return a token').toBeTruthy();

  await context.addCookies([
    { name: 'token', value: token, domain: new URL(BASE_URL).hostname, path: '/', sameSite: 'Lax' },
  ]);
  await context.storageState({ path: ADMIN_STATE });
});
