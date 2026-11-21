import { expect, test } from '../../src/fixtures';
import { buildRoom } from '../../src/platform/data';
import { RoomsPage } from '../../src/platform/pages/rooms-page';

// Rooms: the test plan's main validation and functional risks.
// UI outcomes are confirmed against the API, which is the source of truth.
test.describe('Platform UI: rooms', () => {
  test('admin can create a room and it is stored', async ({ page, adminApi }) => {
    const rooms = new RoomsPage(page);
    await rooms.goto();
    const room = buildRoom({ type: 'Family', accessible: true, roomPrice: 175, features: ['WiFi', 'Views'] });
    await rooms.createRoom(room);

    await expect(rooms.row(room.roomName)).toBeVisible();
    const stored = (await (await adminApi.listRooms()).json()).rooms;
    expect(stored).toContainEqual(expect.objectContaining({
      roomName: room.roomName, type: 'Family', accessible: true, roomPrice: 175,
    }));
  });

  test('submitting an empty form says which fields are missing', { annotation: { type: 'bug', description: 'RBP-09' } }, async ({ page }) => {
    const rooms = new RoomsPage(page);
    await rooms.goto();
    await rooms.create.click();
    await expect(rooms.error).toBeVisible();
    await expect(rooms.error, 'RBP-09: the error should name the missing fields, not only "Failed to create room"').toContainText(/room ?name|price/i);
  });

  test('required fields are marked as required', { annotation: { type: 'bug', description: 'RBP-09' } }, async ({ page }) => {
    const rooms = new RoomsPage(page);
    await rooms.goto();
    for (const field of [rooms.roomName, rooms.price]) {
      const required = await field.evaluate((e) => (e as HTMLInputElement).required || e.getAttribute('aria-required') === 'true');
      expect(required, 'RBP-09: room name and price are required by the API but not marked in the form').toBe(true);
    }
  });

  test('form inputs have accessible labels', { annotation: { type: 'bug', description: 'RBP-14' } }, async ({ page }) => {
    const rooms = new RoomsPage(page);
    await rooms.goto();
    await expect(page.getByLabel(/room ?(name|#)/i), 'RBP-14: the room name input has no label').toHaveCount(1);
    await expect(page.getByLabel(/price/i), 'RBP-14: the price input has no label').toHaveCount(1);
  });

  test('opening a room shows its details', { annotation: { type: 'bug', description: 'RBP-06' } }, async ({ page, adminApi }) => {
    const room = buildRoom({ features: ['WiFi'] });
    await adminApi.createRoomAndGetId(room);
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(room.roomName);
    await rooms.open(room.roomName);
    await expect(page).toHaveURL(/\/admin\/room\/\d+$/);
    await expect(page.getByText(room.roomName), 'RBP-06: the room page should show the room (GET /api/room/{id} returns 500)').toBeVisible();
  });

  test('admin can delete a room', { annotation: { type: 'bug', description: 'RBP-05' } }, async ({ page, adminApi }) => {
    const room = buildRoom();
    await adminApi.createRoomAndGetId(room);
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(room.roomName);
    await rooms.delete(room.roomName);
    await expect(rooms.row(room.roomName), 'RBP-05: the room should be removed (DELETE /api/room/{id} returns 500)').toBeHidden();
  });

  test('a room name containing HTML is shown as text, not run as code', async ({ page, adminApi }) => {
    // OWASP A03 (injection / XSS), light check from the test plan.
    const room = buildRoom({ roomName: `<img src=x onerror=window.__xss=1>${Date.now() % 100000}` });
    await adminApi.createRoomAndGetId(room);
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(room.roomName);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });
});
