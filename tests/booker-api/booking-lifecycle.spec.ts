import { expect, test } from '../../src/fixtures';
import { buildBookerBooking } from '../../src/booker/data';

// The most critical flow of a booking API: a booking can be made, found,
// changed and cancelled, and each step is reflected when it is read back.
test.describe('Restful Booker API: booking lifecycle', () => {
  test('health check responds', async ({ bookerApi }) => {
    expect((await bookerApi.ping()).status()).toBe(201);
  });

  test('a guest can create a booking and read it back without a token', async ({ bookerApi, bookerToken }) => {
    const booking = buildBookerBooking();
    const created = await bookerApi.createBooking(booking);
    expect(created.status()).toBe(200);
    const { bookingid, booking: echoed } = await created.json();
    expect(echoed).toEqual(booking);

    const read = await bookerApi.getBooking(bookingid);
    expect(read.status()).toBe(200);
    expect(await read.json()).toEqual(booking);

    await bookerApi.deleteBooking(bookingid, bookerToken);
  });

  test('create, find, update, patch and delete a booking', async ({ bookerApi, bookerToken }) => {
    const booking = buildBookerBooking();
    let id = 0;

    await test.step('create', async () => {
      const response = await bookerApi.createBooking(booking);
      expect(response.status()).toBe(200);
      id = (await response.json()).bookingid;
    });

    await test.step('find it by guest name', async () => {
      const response = await bookerApi.listBookingIds({ firstname: booking.firstname, lastname: booking.lastname });
      expect(await response.json()).toEqual([{ bookingid: id }]);
    });

    const updated = { ...booking, totalprice: 300, additionalneeds: 'Late checkout' };
    await test.step('full update with a token', async () => {
      const response = await bookerApi.updateBooking(id, updated, bookerToken);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual(updated);
    });

    await test.step('partial update changes only the given field', async () => {
      const response = await bookerApi.patchBooking(id, { firstname: 'Testb' }, bookerToken);
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ ...updated, firstname: 'Testb' });
    });

    await test.step('delete with a token', async () => {
      expect((await bookerApi.deleteBooking(id, bookerToken)).status()).toBe(201);
    });

    await test.step('a deleted booking is gone', async () => {
      expect((await bookerApi.getBooking(id)).status()).toBe(404);
    });
  });

  test('reading a booking that does not exist returns 404', async ({ bookerApi }) => {
    expect((await bookerApi.getBooking(999_999_999)).status()).toBe(404);
  });
});
