import { expect, test } from '../../src/fixtures';
import { buildBookerBooking } from '../../src/booker/data';

// Bad input must be refused with 400 and must not create a booking.
// Each test asserts the correct behaviour, so a defect fails the test with its bug ID.
// The API currently stores most bad input; the fixture deletes anything it accepted.
test.describe('Restful Booker API: booking validation', () => {
  test('missing required field (lastname) is a 400, not a server error', { annotation: { type: 'bug', description: 'RB-01' } }, async ({ bookerApi }) => {
    const { lastname: _omit, ...withoutLastname } = buildBookerBooking();
    const response = await bookerApi.createBooking(withoutLastname);
    expect(response.status(), 'RB-01: a booking without lastname should be refused with 400').toBe(400);
  });

  test('checkout before checkin is refused', { annotation: { type: 'bug', description: 'RB-02' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createBooking(
      buildBookerBooking({ bookingdates: { checkin: '2027-06-10', checkout: '2027-06-05' } }),
    );
    expect(response.status(), 'RB-02: checkout before checkin should be refused with 400').toBe(400);
  });

  test('an invalid date is refused', { annotation: { type: 'bug', description: 'RB-03' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createBooking(
      buildBookerBooking({ bookingdates: { checkin: 'not-a-date', checkout: '2027-06-05' } }),
    );
    expect(response.status(), 'RB-03: checkin "not-a-date" should be refused with 400').toBe(400);
  });

  test('a negative total price is refused', { annotation: { type: 'bug', description: 'RB-04' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createBooking(buildBookerBooking({ totalprice: -50 }));
    expect(response.status(), 'RB-04: totalprice -50 should be refused with 400').toBe(400);
  });

  test('a non-boolean depositpaid is refused, not coerced', { annotation: { type: 'bug', description: 'RB-06' } }, async ({ bookerApi }) => {
    const response = await bookerApi.createBooking({ ...buildBookerBooking(), depositpaid: 'yes' });
    expect(response.status(), 'RB-06: depositpaid "yes" should be refused with 400, not stored as true').toBe(400);
  });
});
