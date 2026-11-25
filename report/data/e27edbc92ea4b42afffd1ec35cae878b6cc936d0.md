# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booker-api/booking-search.spec.ts >> Restful Booker API: searching bookings >> checkin filter includes a booking that starts on the given date
- Location: tests/booker-api/booking-search.spec.ts:36:3

# Error details

```
Error: RB-07: checkin=2037-09-14 should include a booking with that checkin ("greater than or equal")

expect(received).toContain(expected) // indexOf

Expected value: 343
Received array: []
```

# Test source

```ts
  1  | import { expect, test } from '../../src/fixtures';
  2  | import { buildBookerBooking } from '../../src/booker/data';
  3  | 
  4  | /** yyyy-mm-dd, a number of days after a base date. */
  5  | function addDays(base: string, days: number): string {
  6  |   const d = new Date(`${base}T00:00:00Z`);
  7  |   d.setUTCDate(d.getUTCDate() + days);
  8  |   return d.toISOString().slice(0, 10);
  9  | }
  10 | 
  11 | // GET /booking returns booking ids and can filter them. The apidoc says the date
  12 | // filters return bookings with checkin (or checkout) "greater than or equal to" the
  13 | // given date. Each test creates its own booking on a random far-future date and only
  14 | // checks whether that booking is in the result; other people's bookings are ignored.
  15 | test.describe('Restful Booker API: searching bookings', () => {
  16 |   let id = 0;
  17 |   let checkin = '';
  18 |   let checkout = '';
  19 | 
  20 |   test.beforeEach(async ({ bookerApi }) => {
  21 |     checkin = addDays('2032-01-01', Math.floor(Math.random() * 3000));
  22 |     checkout = addDays(checkin, 4);
  23 |     id = await bookerApi.createBookingAndGetId(buildBookerBooking({ bookingdates: { checkin, checkout } }));
  24 |   });
  25 | 
  26 |   test('without a filter, every booking id is returned', async ({ bookerApi }) => {
  27 |     expect(await bookerApi.readBookingIds()).toContain(id);
  28 |   });
  29 | 
  30 |   test('filtering by name returns only that booking', async ({ bookerApi }) => {
  31 |     const booking = buildBookerBooking();
  32 |     const own = await bookerApi.createBookingAndGetId(booking);
  33 |     expect(await bookerApi.readBookingIds({ firstname: booking.firstname, lastname: booking.lastname })).toEqual([own]);
  34 |   });
  35 | 
  36 |   test('checkin filter includes a booking that starts on the given date', { annotation: { type: 'bug', description: 'RB-07' } }, async ({ bookerApi }) => {
> 37 |     expect(await bookerApi.readBookingIds({ checkin }), `RB-07: checkin=${checkin} should include a booking with that checkin ("greater than or equal")`).toContain(id);
     |                                                                                                                                                           ^ Error: RB-07: checkin=2037-09-14 should include a booking with that checkin ("greater than or equal")
  38 |   });
  39 | 
  40 |   test('checkin filter includes a booking that starts after the given date', async ({ bookerApi }) => {
  41 |     expect(await bookerApi.readBookingIds({ checkin: addDays(checkin, -1) })).toContain(id);
  42 |   });
  43 | 
  44 |   test('checkin filter excludes a booking that starts before the given date', async ({ bookerApi }) => {
  45 |     expect(await bookerApi.readBookingIds({ checkin: addDays(checkin, 1) })).not.toContain(id);
  46 |   });
  47 | 
  48 |   test('checkout filter includes a booking that ends on the given date', async ({ bookerApi }) => {
  49 |     expect(await bookerApi.readBookingIds({ checkout })).toContain(id);
  50 |   });
  51 | 
  52 |   test('checkout filter includes a booking that ends after the given date', { annotation: { type: 'bug', description: 'RB-08' } }, async ({ bookerApi }) => {
  53 |     expect(await bookerApi.readBookingIds({ checkout: addDays(checkout, -1) }),
  54 |       `RB-08: checkout=${addDays(checkout, -1)} should include a booking ending ${checkout} ("greater than or equal")`).toContain(id);
  55 |   });
  56 | 
  57 |   test('checkout filter excludes a booking that ends before the given date', { annotation: { type: 'bug', description: 'RB-08' } }, async ({ bookerApi }) => {
  58 |     expect(await bookerApi.readBookingIds({ checkout: addDays(checkout, 1) }),
  59 |       `RB-08: checkout=${addDays(checkout, 1)} should exclude a booking ending ${checkout}`).not.toContain(id);
  60 |   });
  61 | 
  62 |   test('an invalid filter date is refused with 400, not a server error', { annotation: { type: 'bug', description: 'RB-09' } }, async ({ bookerApi }) => {
  63 |     const response = await bookerApi.listBookingIds({ checkin: 'not-a-date' });
  64 |     expect(response.status(), 'RB-09: checkin=not-a-date should be refused with 400').toBe(400);
  65 |   });
  66 | });
  67 | 
```