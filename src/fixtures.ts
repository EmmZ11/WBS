import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import { BookerApi } from './booker/booker-api';
import type { TokenResponse } from './booker/data';
import { ADMIN_STATE, BASE_URL, BOOKER_BASE_URL, bookerCredentials } from './config';
import { PlatformApi } from './platform/platform-api';
import { readJson } from './utils/read-json';

interface TestFixtures {
  /** Platform API logged in as admin. Cleans up what it created after each test. */
  adminApi: PlatformApi;
  /** Platform API with no session, for access-control checks. */
  guestApi: PlatformApi;
  /** Restful Booker API client. Deletes the bookings it created after each test. */
  bookerApi: BookerApi;
}

interface WorkerFixtures {
  /** A valid Restful Booker token, created once per worker through POST /auth. */
  bookerToken: string;
}

/* eslint-disable no-empty-pattern -- Playwright requires an object pattern for fixtures without dependencies. */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  adminApi: async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: BASE_URL, storageState: ADMIN_STATE });
    const api = new PlatformApi(context);
    await use(api);
    await api.deleteCreated();
    await context.dispose();
  },

  guestApi: async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: BASE_URL });
    await use(new PlatformApi(context));
    await context.dispose();
  },

  bookerToken: [async ({}, use) => {
    const context = await playwrightRequest.newContext({ baseURL: BOOKER_BASE_URL });
    const { username, password } = bookerCredentials();
    const { token } = await readJson<TokenResponse>(await new BookerApi(context).createToken(username, password));
    expect(token, 'precondition: POST /auth should return a token').toBeTruthy();
    await use(token!);
    await context.dispose();
  }, { scope: 'worker' }],

  bookerApi: async ({ bookerToken }, use) => {
    const context = await playwrightRequest.newContext({ baseURL: BOOKER_BASE_URL });
    const api = new BookerApi(context);
    await use(api);
    await api.deleteCreated(bookerToken);
    await context.dispose();
  },
});
/* eslint-enable no-empty-pattern */

export { expect };
