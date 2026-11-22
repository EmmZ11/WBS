import { expect, test } from '../../src/fixtures';
import { buildBookerBooking, type BookerBooking, type CreatedBooking } from '../../src/booker/data';
import { readJson } from '../../src/utils/read-json';

// The most critical flow of a booking API: a booking can be made, found, changed and
// cancelled, and each step is reflected when it is read back.
// Status codes follow the apidoc: ping 201, create 200, update 200, delete 201.
test.describe('Restful Booker API: booking lifecycle', () => {
  test('health check responds', async ({ bookerApi }) => {
    expect((await bookerApi.ping()).status()).toBe(201);
  });

  test('a guest can create a booking and read it back without a token', async ({ bookerApi }) => {
    const booking = buildBookerBooking();
    const created = await bookerApi.createBooking(booking);
    expect(created.status()).toBe(200);
    const { bookingid, booking: echoed } = await readJson<CreatedBooking>(created);
    expect(echoed).toEqual(booking);

    const read = await bookerApi.getBooking(bookingid);
    expect(read.status()).toBe(200);
    expect(await readJson<BookerBooking>(read)).toEqual(booking);
  });

  test('create, find, update, patch and delete a booking (token cookie)', async ({ bookerApi, bookerToken }) => {
    const booking = buildBookerBooking();
    const auth = { token: bookerToken };

    const id = await test.step('create', () => bookerApi.createBookingAndGetId(booking));

    await test.step('find it by guest name', async () => {
      const response = await bookerApi.listBookingIds({ firstname: booking.firstname, lastname: booking.lastname });
      expect(await response.json()).toEqual([{ bookingid: id }]);
    });

    const updated: BookerBooking = { ...booking, totalprice: 300, additionalneeds: 'Late checkout' };

    await test.step('full update', async () => {
      const response = await bookerApi.updateBooking(id, updated, auth);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('partial update changes only the given field', async () => {
      const response = await bookerApi.patchBooking(id, { firstname: 'Testb' }, auth);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ ...updated, firstname: 'Testb' });
    });

    await test.step('delete', async () => {
      expect((await bookerApi.deleteBooking(id, auth)).status()).toBe(201);
    });

    await test.step('a deleted booking is gone', async () => {
      expect((await bookerApi.getBooking(id)).status()).toBe(404);
    });
  });

  test('a full update with only some fields is refused (400) and changes nothing', async ({ bookerApi, bookerToken }) => {
    // PUT replaces the whole booking; partial changes are what PATCH is for.
    const booking = buildBookerBooking();
    const id = await bookerApi.createBookingAndGetId(booking);
    expect((await bookerApi.updateBooking(id, { firstname: 'Only' }, { token: bookerToken })).status()).toBe(400);
    expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(booking);
  });
});

// A booking id that does not exist (or no longer exists) is a "not found", whatever
// the method. The apidoc does not say, so standard HTTP applies: 404.
test.describe('Restful Booker API: booking that does not exist', () => {
  const MISSING = 999_999_999;

  test('reading it returns 404', async ({ bookerApi }) => {
    expect((await bookerApi.getBooking(MISSING)).status()).toBe(404);
  });

  test('updating it returns 404', { annotation: { type: 'bug', description: 'RB-10' } }, async ({ bookerApi, bookerToken }) => {
    const response = await bookerApi.updateBooking(MISSING, buildBookerBooking(), { token: bookerToken });
    expect(response.status(), 'RB-10: updating a booking that does not exist should be 404').toBe(404);
  });

  test('partially updating it returns 404', { annotation: { type: 'bug', description: 'RB-10' } }, async ({ bookerApi, bookerToken }) => {
    const response = await bookerApi.patchBooking(MISSING, { firstname: 'Testa' }, { token: bookerToken });
    expect(response.status(), 'RB-10: patching a booking that does not exist should be 404').toBe(404);
  });

  test('deleting it returns 404', { annotation: { type: 'bug', description: 'RB-10' } }, async ({ bookerApi, bookerToken }) => {
    const response = await bookerApi.deleteBooking(MISSING, { token: bookerToken });
    expect(response.status(), 'RB-10: deleting a booking that does not exist should be 404').toBe(404);
  });
});
