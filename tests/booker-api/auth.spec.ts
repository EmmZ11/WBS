import { expect, test } from '../../src/fixtures';
import { buildBookerBooking, type BookerAuth, type BookerBooking, type TokenResponse } from '../../src/booker/data';
import { bookerCredentials } from '../../src/config';
import { readJson } from '../../src/utils/read-json';

// Changing or cancelling someone's booking must need valid authorisation (OWASP A01/A07).
// The apidoc documents two methods for PUT, PATCH and DELETE: a token cookie (from
// POST /auth) or a Basic auth header. Both are tested, and so is having neither.
// Status codes: the apidoc documents 403 for refused writes, so that is expected.
// It documents nothing for a failed login, so standard HTTP applies there (401).
test.describe('Restful Booker API: authentication', () => {
  test('valid credentials return a token', async ({ bookerApi }) => {
    const { username, password } = bookerCredentials();
    const response = await bookerApi.createToken(username, password);
    expect(response.status()).toBe(200);
    expect((await readJson<TokenResponse>(response)).token).toEqual(expect.any(String));
  });

  test('bad credentials are refused with 401', { annotation: { type: 'bug', description: 'RB-05' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect(response.status(), 'RB-05: bad credentials should be refused with 401').toBe(401);
  });

  test('bad credentials never return a token', async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect((await readJson<TokenResponse>(response)).token).toBeUndefined();
  });
});

test.describe('Restful Booker API: authorisation of writes', () => {
  let original: BookerBooking;
  let id = 0;

  test.beforeEach(async ({ bookerApi }) => {
    original = buildBookerBooking();
    id = await bookerApi.createBookingAndGetId(original);
  });

  const refused: Record<string, BookerAuth | undefined> = {
    'no authorisation': undefined,
    'a forged token': { token: 'forged' },
    'wrong Basic credentials': { username: 'not-a-user', password: 'not-a-password' },
  };

  for (const [label, auth] of Object.entries(refused)) {
    test(`update with ${label} is forbidden and changes nothing`, async ({ bookerApi }) => {
      expect((await bookerApi.updateBooking(id, { ...original, totalprice: 1 }, auth)).status()).toBe(403);
      expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(original);
    });

    test(`partial update with ${label} is forbidden and changes nothing`, async ({ bookerApi }) => {
      expect((await bookerApi.patchBooking(id, { firstname: 'Changed' }, auth)).status()).toBe(403);
      expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(original);
    });

    test(`delete with ${label} is forbidden and the booking survives`, async ({ bookerApi }) => {
      expect((await bookerApi.deleteBooking(id, auth)).status()).toBe(403);
      expect((await bookerApi.getBooking(id)).status()).toBe(200);
    });
  }

  // The token cookie is used by the lifecycle test; Basic auth, the documented alternative, here.
  test('Basic auth allows update, partial update and delete', async ({ bookerApi }) => {
    const basic = bookerCredentials();
    const updated: BookerBooking = { ...original, totalprice: 250 };

    await test.step('update', async () => {
      const response = await bookerApi.updateBooking(id, updated, basic);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('partial update', async () => {
      const response = await bookerApi.patchBooking(id, { firstname: 'Testb' }, basic);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ ...updated, firstname: 'Testb' });
    });

    await test.step('delete', async () => {
      expect((await bookerApi.deleteBooking(id, basic)).status()).toBe(201);
      expect((await bookerApi.getBooking(id)).status()).toBe(404);
    });
  });
});
