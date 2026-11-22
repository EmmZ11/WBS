import { expect, test as setup } from '@playwright/test';
import { BookerApi } from '../src/booker/booker-api';
import type { TokenResponse } from '../src/booker/data';
import { bookerCredentials } from '../src/config';
import { readJson } from '../src/utils/read-json';

// Checks the Restful Booker credentials before any booker-api test runs. If they are
// wrong, this one setup test fails and the booker-api tests are skipped, instead of
// every test failing with a confusing token error. (Tokens themselves are created per
// worker by the bookerToken fixture.)
setup('Restful Booker credentials return a token', async ({ request }) => {
  const { username, password } = bookerCredentials();
  const response = await new BookerApi(request).createToken(username, password);
  expect(response.status()).toBe(200);
  const { token } = await readJson<TokenResponse>(response);
  expect(token, 'POST /auth should return a token (check BOOKER_USERNAME / BOOKER_PASSWORD)').toBeTruthy();
});
