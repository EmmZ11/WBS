import { expect, test } from '../../src/fixtures';
import { buildBooking, buildRoom, isoDate, type ValidationErrors } from '../../src/platform/data';
import { readJson } from '../../src/utils/read-json';

// Validation is the main risk in the test plan. Room 1 is one of the site's own rooms;
// it is used here only for requests that must be refused. If validation ever regressed,
// the fixture's clean-up would try to remove anything created.
const EXISTING_ROOM = 1;

test.describe('Platform API: booking validation', () => {
  test('rejects an empty booking with 400 and lists the missing fields', async ({ guestApi }) => {
    const response = await guestApi.createBooking({});
    expect(response.status()).toBe(400);
    const { errors } = await readJson<ValidationErrors>(response);
    expect(errors).toEqual(
      expect.arrayContaining(['Firstname should not be blank', 'Lastname should not be blank']),
    );
  });

  // Boundaries from the API's own messages: firstname 3-18, lastname 3-30.
  for (const [field, value] of [
    ['firstname', 'Ab'],
    ['firstname', 'A'.repeat(19)],
    ['lastname', 'Ab'],
    ['lastname', 'A'.repeat(31)],
  ] as const) {
    test(`rejects ${field} of length ${value.length} with 400`, async ({ guestApi }) => {
      const response = await guestApi.createBooking(buildBooking(EXISTING_ROOM, { [field]: value }));
      expect(response.status()).toBe(400);
    });
  }

  test('validation errors name the field at fault', { annotation: { type: 'bug', description: 'RBP-02' } }, async ({ guestApi }) => {
    const response = await guestApi.createBooking(buildBooking(EXISTING_ROOM, { firstname: 'Ab' }));
    expect(response.status(), 'a 2-character first name should be refused').toBe(400);
    const { errors } = await readJson<ValidationErrors>(response);
    expect(errors.join(' '), 'RBP-02: the length error should name the field (firstname)').toMatch(/firstname/i);
  });

  test('checkout before checkin is rejected as a validation error (400)', { annotation: { type: 'bug', description: 'RBP-03' } }, async ({ adminApi }) => {
    // A fresh room has no bookings, so a 409 here cannot be a genuine date clash.
    const roomid = await adminApi.createRoomAndGetId(buildRoom());
    const response = await adminApi.createBooking(
      buildBooking(roomid, { bookingdates: { checkin: isoDate(40), checkout: isoDate(38) } }),
    );
    expect(response.status(), 'RBP-03: checkout before checkin is invalid input and should be a 400, not a 409 conflict').toBe(400);
  });
});
