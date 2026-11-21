import { expect, test } from '../../src/fixtures';
import { buildBooking, buildRoom } from '../../src/platform/data';

// Bookings made by admin from the Report page go through this API. Each test
// books its own fresh room, so other people's bookings on the shared site never clash.
test.describe('Platform API: bookings (admin)', () => {
  let roomid = 0;

  test.beforeEach(async ({ adminApi }) => {
    roomid = await adminApi.createRoomAndGetId(buildRoom());
  });

  test('a valid booking is created (201) and shows for its room and in the report', async ({ adminApi }) => {
    const booking = buildBooking(roomid);
    const response = await adminApi.createBooking(booking);
    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({ roomid, firstname: booking.firstname, lastname: booking.lastname });

    const { bookings } = await (await adminApi.listBookings(roomid)).json();
    expect(bookings).toContainEqual(expect.objectContaining({ lastname: booking.lastname, bookingdates: booking.bookingdates }));

    const { report } = await (await adminApi.getReport()).json();
    expect(report.map((e: { title: string }) => e.title)).toContainEqual(expect.stringContaining(booking.lastname));
  });

  test('an overlapping booking for the same room is refused with 409', async ({ adminApi }) => {
    const first = buildBooking(roomid);
    expect((await adminApi.createBooking(first)).status()).toBe(201);
    const overlapping = buildBooking(roomid, {
      bookingdates: { checkin: first.bookingdates.checkin, checkout: first.bookingdates.checkout },
    });
    expect((await adminApi.createBooking(overlapping)).status()).toBe(409);
  });

  test('admin can read a booking by id', { annotation: { type: 'bug', description: 'RBP-08' } }, async ({ adminApi }) => {
    const { bookingid } = await (await adminApi.createBooking(buildBooking(roomid))).json();
    const response = await adminApi.getBooking(bookingid);
    expect(response.status(), `RBP-08: GET /api/booking/${bookingid} should return the booking`).toBe(200);
  });

  test('admin can cancel a booking', { annotation: { type: 'bug', description: 'RBP-08' } }, async ({ adminApi }) => {
    const { bookingid } = await (await adminApi.createBooking(buildBooking(roomid))).json();
    const response = await adminApi.deleteBooking(bookingid);
    expect(response.ok(), `RBP-08: DELETE /api/booking/${bookingid} should succeed, got ${response.status()}`).toBe(true);
  });
});
