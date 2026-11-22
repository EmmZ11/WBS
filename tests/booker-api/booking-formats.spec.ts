import { expect, test } from '../../src/fixtures';
import { buildBookerBooking, type BookerBooking, type CreatedBooking } from '../../src/booker/data';
import { readJson } from '../../src/utils/read-json';

// The apidoc says bookings can be sent as JSON, XML (text/xml) or a URL-encoded form,
// and read back as JSON or XML (Accept: application/xml). JSON is covered by the
// lifecycle tests; the other documented formats are covered here. Every booking is
// read back as JSON to prove it was stored correctly.
test.describe('Restful Booker API: request and response formats', () => {
  test('a booking can be read as XML, with an XML content type', { annotation: { type: 'bug', description: 'RB-11' } }, async ({ bookerApi }) => {
    const booking = buildBookerBooking();
    const id = await bookerApi.createBookingAndGetId(booking);
    const response = await bookerApi.getBooking(id, 'application/xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain(`<lastname>${booking.lastname}</lastname>`);
    expect(body).toContain(`<checkin>${booking.bookingdates.checkin}</checkin>`);
    expect(response.headers()['content-type'], 'RB-11: an XML body should be sent as application/xml, not text/html').toMatch(/xml/);
  });

  test('a booking can be created with an XML body', async ({ bookerApi }) => {
    const booking = buildBookerBooking();
    const response = await bookerApi.createBookingXml(booking);
    expect(response.status()).toBe(200);
    const id = Number(/<bookingid>(\d+)<\/bookingid>/.exec(await response.text())?.[1]);
    expect(id, 'the XML response should contain the new booking id').toBeGreaterThan(0);
    expect(await readJson<BookerBooking>(await bookerApi.getBooking(id))).toEqual(booking);
  });

  test('a booking can be created with a URL-encoded form body', async ({ bookerApi }) => {
    const booking = buildBookerBooking();
    const response = await bookerApi.createBookingForm(booking);
    expect(response.status()).toBe(200);
    const { bookingid, booking: echoed } = await readJson<CreatedBooking>(response);
    expect(echoed).toEqual(booking);
    expect(await readJson<BookerBooking>(await bookerApi.getBooking(bookingid))).toEqual(booking);
  });
});
