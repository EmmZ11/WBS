import { expect, test } from '../../src/fixtures';
import { buildBooking, isoDate } from '../../src/platform/data';

// Validation is the main risk in the test plan. These requests are all invalid,
// so they never create data on the shared site.
test.describe('Platform API: booking validation', () => {
  test('rejects an empty booking with 400 and lists the missing fields', async ({ guestApi }) => {
    const response = await guestApi.createBooking({});
    expect(response.status()).toBe(400);
    const { errors } = await response.json();
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
      const response = await guestApi.createBooking(buildBooking(1, { [field]: value }));
      expect(response.status()).toBe(400);
    });
  }

  test('validation errors name the field at fault', { annotation: { type: 'bug', description: 'RBP-02' } }, async ({ guestApi }) => {
    const response = await guestApi.createBooking(buildBooking(1, { firstname: 'Ab' }));
    const { errors } = await response.json();
    expect(errors.join(' '), 'RBP-02: the length error should name the field (firstname)').toMatch(/firstname/i);
  });

  test('checkout before checkin is rejected as a validation error (400)', { annotation: { type: 'bug', description: 'RBP-03' } }, async ({ guestApi }) => {
    const response = await guestApi.createBooking(
      buildBooking(1, { bookingdates: { checkin: isoDate(40), checkout: isoDate(38) } }),
    );
    expect(response.status(), 'RBP-03: checkout before checkin is invalid input and should be a 400, not a 409 conflict').toBe(400);
  });
});
