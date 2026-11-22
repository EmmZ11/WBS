import { expect, test } from '../../src/fixtures';
import { buildRoom } from '../../src/platform/data';
import { RoomsPage } from '../../src/platform/pages/rooms-page';
import { uniqueId } from '../../src/utils/unique-id';

// Rooms: the test plan's main validation and functional risks.
// UI outcomes are confirmed against the API, which is the source of truth.
test.describe('Platform UI: rooms', () => {
  test('admin can create a room and it is stored', async ({ page, adminApi }) => {
    const rooms = new RoomsPage(page);
    await rooms.goto();
    const room = buildRoom({ type: 'Family', accessible: true, roomPrice: 175, features: ['WiFi', 'Views'] });
    await rooms.createRoom(room);

    await expect(rooms.row(room.roomName)).toBeVisible();
    expect(await adminApi.readRooms()).toContainEqual(expect.objectContaining({
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
    const roomid = await adminApi.createRoomAndGetId(room);
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(roomid);
    await rooms.open(roomid);
    await expect(page).toHaveURL(new RegExp(`/admin/room/${roomid}$`));
    await expect(page.getByText(room.roomName).first(), 'RBP-06: the room page should show the room (GET /api/room/{id} returns 500)').toBeVisible();
  });

  test('admin can delete a room', { annotation: { type: 'bug', description: 'RBP-05' } }, async ({ page, adminApi }) => {
    const roomid = await adminApi.createRoomAndGetId(buildRoom());
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(roomid);
    await rooms.delete(roomid);
    await expect(rooms.rowById(roomid), 'RBP-05: the room should leave the list (DELETE /api/room/{id} returns 500)').toBeHidden();
    // Source of truth: the room must be gone from the API too, not just hidden in the UI.
    expect((await adminApi.readRooms()).map((r) => r.roomid), 'RBP-05: the room is still stored').not.toContain(roomid);
  });

  test('a room name containing HTML is shown as text, not run as code', async ({ page, adminApi }) => {
    // OWASP A03 (injection / XSS), light check from the test plan.
    // The row is found by id, so it is found even if the name were rendered as HTML.
    const roomName = `<img src=x onerror=window.__xss=1>QA${uniqueId()}`;
    const roomid = await adminApi.createRoomAndGetId(buildRoom({ roomName }));
    const rooms = new RoomsPage(page);
    await rooms.gotoWithRoom(roomid);
    await expect(rooms.rowById(roomid), 'the name should be displayed literally').toContainText(roomName);
    // Had the name been rendered as HTML, the row would contain an <img> element.
    await expect(rooms.rowById(roomid).locator('img'), 'stored XSS: the name was rendered as HTML').toHaveCount(0);
    expect(await page.evaluate(() => (window as { __xss?: number }).__xss), 'stored XSS: the injected script ran').toBeUndefined();
  });
});
