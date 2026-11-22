import { expect, test } from '../../src/fixtures';
import { buildBookerBooking, type BookerBooking, type TokenResponse } from '../../src/booker/data';
import { readJson } from '../../src/utils/read-json';

// Changing or cancelling someone's booking must need a valid token (OWASP A01/A07).
// Status codes: the apidoc documents 403 for refused writes, so that is what is expected.
// It documents nothing for a failed login, so standard HTTP applies there (401).
test.describe('Restful Booker API: authentication and authorisation', () => {
  test('bad credentials are refused with 401', { annotation: { type: 'bug', description: 'RB-05' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect(response.status(), 'RB-05: bad credentials should be refused with 401').toBe(401);
  });

  test('bad credentials never return a token', async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect((await readJson<TokenResponse>(response)).token).toBeUndefined();
  });

  test.describe('write operations without a valid token', () => {
    let original: BookerBooking;
    let id = 0;

    test.beforeEach(async ({ bookerApi }) => {
      original = buildBookerBooking();
      id = await bookerApi.createBookingAndGetId(original);
    });

    test('update without a token is forbidden and changes nothing', async ({ bookerApi }) => {
      const response = await bookerApi.updateBooking(id, { ...original, totalprice: 1 });
      expect(response.status()).toBe(403);
      expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(original);
    });

    test('update with a forged token is forbidden and changes nothing', async ({ bookerApi }) => {
      const response = await bookerApi.updateBooking(id, { ...original, totalprice: 1 }, 'forged');
      expect(response.status()).toBe(403);
      expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(original);
    });

    test('delete without a token is forbidden and the booking survives', async ({ bookerApi }) => {
      expect((await bookerApi.deleteBooking(id)).status()).toBe(403);
      expect((await bookerApi.getBooking(id)).status()).toBe(200);
    });
  });
});
