import { expect, test } from '../../src/fixtures';
import { buildRoom } from '../../src/platform/data';

// OWASP A01 Broken Access Control: admin data and actions must need a session.
test.describe('Platform API: access control without a session', () => {
  test('cannot create a room', async ({ guestApi }) => {
    const response = await guestApi.createRoom(buildRoom());
    expect(response.status()).toBe(401);
  });

  test('cannot delete a room (401, not a server error)', { annotation: { type: 'bug', description: 'RBP-05' } }, async ({ guestApi, adminApi }) => {
    // Our own room, so a regression in access control could never delete real data.
    const roomid = await adminApi.createRoomAndGetId(buildRoom());
    const response = await guestApi.deleteRoom(roomid);
    expect(response.status(), 'RBP-05: an unauthenticated delete should be refused with 401').toBe(401);
  });

  test('cannot change branding', async ({ guestApi }) => {
    const current = await guestApi.readBranding();
    expect((await guestApi.updateBranding(current)).status()).toBe(401);
  });

  test('cannot list bookings', async ({ guestApi }) => {
    expect((await guestApi.listBookings()).status()).toBe(401);
  });

  test('cannot read the booking report', async ({ guestApi }) => {
    expect((await guestApi.getReport()).status()).toBe(401);
  });

  test('cannot list guest messages', { annotation: { type: 'bug', description: 'RBP-01' } }, async ({ guestApi }) => {
    const response = await guestApi.listMessages();
    expect(response.status(), 'RBP-01: guest messages (names, subjects) should need an admin session (401)').toBe(401);
  });
});
