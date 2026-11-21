import { expect, test as setup } from '@playwright/test';
import { BookerApi } from '../src/booker/booker-api';
import { bookerCredentials } from '../src/config';

// Proves the Restful Booker credentials work before any booker-api test runs.
// Without this, a credentials problem would surface as a confusing failure
// in every test that needs a token, instead of one clear setup failure.
setup('Restful Booker credentials return a token', async ({ request }) => {
  const { username, password } = bookerCredentials();
  const response = await new BookerApi(request).createToken(username, password);
  expect((await response.json()).token).toBeTruthy();
});
