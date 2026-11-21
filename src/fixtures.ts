import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import { BookerApi } from './booker/booker-api';
import { ADMIN_STATE, BASE_URL, BOOKER_BASE_URL, bookerCredentials } from './config';
import { PlatformApi } from './platform/platform-api';

interface Fixtures {
  /** Platform API logged in as admin (session saved by the setup project). */
  adminApi: PlatformApi;
  /** Platform API with no session, for access-control and public-endpoint checks. */
  guestApi: PlatformApi;
  /** Restful Booker API client (Option A). */
  bookerApi: BookerApi;
  /** A valid Restful Booker token, created through POST /auth. */
  bookerToken: string;
}

async function apiContext(baseURL: string, storageState?: string) {
  return playwrightRequest.newContext({ baseURL, storageState });
}

export const test = base.extend<Fixtures>({
  adminApi: async ({}, use) => {
    const context = await apiContext(BASE_URL, ADMIN_STATE);
    await use(new PlatformApi(context));
    await context.dispose();
  },
  guestApi: async ({}, use) => {
    const context = await apiContext(BASE_URL);
    await use(new PlatformApi(context));
    await context.dispose();
  },
  bookerApi: async ({}, use) => {
    const context = await apiContext(BOOKER_BASE_URL);
    await use(new BookerApi(context));
    await context.dispose();
  },
  bookerToken: async ({ bookerApi }, use) => {
    const { username, password } = bookerCredentials();
    const response = await bookerApi.createToken(username, password);
    const body = await response.json();
    expect(body.token, 'POST /auth should return a token').toBeTruthy();
    await use(body.token);
  },
});

export { expect };
