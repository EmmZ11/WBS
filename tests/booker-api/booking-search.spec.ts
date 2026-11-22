import { expect, test } from '../../src/fixtures';
import { buildBookerBooking } from '../../src/booker/data';

/** yyyy-mm-dd, a number of days after a base date. */
function addDays(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// GET /booking returns booking ids and can filter them. The apidoc says the date
// filters return bookings with checkin (or checkout) "greater than or equal to" the
// given date. Each test creates its own booking on a random far-future date and only
// checks whether that booking is in the result; other people's bookings are ignored.
test.describe('Restful Booker API: searching bookings', () => {
  let id = 0;
  let checkin = '';
  let checkout = '';

  test.beforeEach(async ({ bookerApi }) => {
    checkin = addDays('2032-01-01', Math.floor(Math.random() * 3000));
    checkout = addDays(checkin, 4);
    id = await bookerApi.createBookingAndGetId(buildBookerBooking({ bookingdates: { checkin, checkout } }));
  });

  test('without a filter, every booking id is returned', async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds()).toContain(id);
  });

  test('filtering by name returns only that booking', async ({ bookerApi }) => {
    const booking = buildBookerBooking();
    const own = await bookerApi.createBookingAndGetId(booking);
    expect(await bookerApi.readBookingIds({ firstname: booking.firstname, lastname: booking.lastname })).toEqual([own]);
  });

  test('checkin filter includes a booking that starts on the given date', { annotation: { type: 'bug', description: 'RB-07' } }, async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkin }), `RB-07: checkin=${checkin} should include a booking with that checkin ("greater than or equal")`).toContain(id);
  });

  test('checkin filter includes a booking that starts after the given date', async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkin: addDays(checkin, -1) })).toContain(id);
  });

  test('checkin filter excludes a booking that starts before the given date', async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkin: addDays(checkin, 1) })).not.toContain(id);
  });

  test('checkout filter includes a booking that ends on the given date', async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkout })).toContain(id);
  });

  test('checkout filter includes a booking that ends after the given date', { annotation: { type: 'bug', description: 'RB-08' } }, async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkout: addDays(checkout, -1) }),
      `RB-08: checkout=${addDays(checkout, -1)} should include a booking ending ${checkout} ("greater than or equal")`).toContain(id);
  });

  test('checkout filter excludes a booking that ends before the given date', { annotation: { type: 'bug', description: 'RB-08' } }, async ({ bookerApi }) => {
    expect(await bookerApi.readBookingIds({ checkout: addDays(checkout, 1) }),
      `RB-08: checkout=${addDays(checkout, 1)} should exclude a booking ending ${checkout}`).not.toContain(id);
  });

  test('an invalid filter date is refused with 400, not a server error', { annotation: { type: 'bug', description: 'RB-09' } }, async ({ bookerApi }) => {
    const response = await bookerApi.listBookingIds({ checkin: 'not-a-date' });
    expect(response.status(), 'RB-09: checkin=not-a-date should be refused with 400').toBe(400);
  });
});
