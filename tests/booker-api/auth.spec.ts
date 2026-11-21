import { expect, test } from '../../src/fixtures';
import { buildBookerBooking } from '../../src/booker/data';

// Changing or cancelling someone's booking must need a valid token (OWASP A01/A07).
test.describe('Restful Booker API: authentication and authorisation', () => {
  test('bad credentials are refused with 401', { annotation: { type: 'bug', description: 'RB-05' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect(response.status(), 'RB-05: bad credentials should be refused with 401').toBe(401);
  });

  test('bad credentials never return a token', async ({ bookerApi }) => {
    const response = await bookerApi.createToken('not-a-user', 'not-a-password');
    expect((await response.json()).token).toBeUndefined();
  });

  test.describe('write operations without a valid token', () => {
    let id = 0;

    test.beforeEach(async ({ bookerApi }) => {
      id = (await (await bookerApi.createBooking(buildBookerBooking())).json()).bookingid;
    });

    test.afterEach(async ({ bookerApi, bookerToken }) => {
      await bookerApi.deleteBooking(id, bookerToken);
    });

    test('update without a token is forbidden', async ({ bookerApi }) => {
      expect((await bookerApi.updateBooking(id, buildBookerBooking())).status()).toBe(403);
    });

    test('update with a forged token is forbidden', async ({ bookerApi }) => {
      expect((await bookerApi.updateBooking(id, buildBookerBooking(), 'forged')).status()).toBe(403);
    });

    test('delete without a token is forbidden and the booking survives', async ({ bookerApi }) => {
      expect((await bookerApi.deleteBooking(id)).status()).toBe(403);
      expect((await bookerApi.getBooking(id)).status()).toBe(200);
    });
  });
});
