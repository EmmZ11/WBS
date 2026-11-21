import { expect, test } from '../../src/fixtures';
import { buildRoom } from '../../src/platform/data';

// Rooms are the core admin data: everything else (bookings, report) hangs off them.
// Note: the demo site resets its data on a schedule, so rooms that cannot be
// deleted (RBP-05) do not accumulate.
test.describe('Platform API: rooms (admin)', () => {
  test('admin can create a room and it appears in the room list', async ({ adminApi }) => {
    const room = buildRoom({ type: 'Double', roomPrice: 150, features: ['WiFi', 'TV'] });
    const response = await adminApi.createRoom(room);
    expect(response.status()).toBe(200);

    const { rooms } = await (await adminApi.listRooms()).json();
    expect(rooms).toContainEqual(expect.objectContaining({
      roomName: room.roomName, type: 'Double', roomPrice: 150, features: ['WiFi', 'TV'],
    }));
  });

  test('an empty room is refused with errors that name the missing fields', { annotation: { type: 'bug', description: 'RBP-09' } }, async ({ adminApi }) => {
    const response = await adminApi.createRoom({});
    expect(response.status()).toBe(400);
    const { errors } = await response.json();
    const unnamed = (errors as string[]).filter((e) => !/room ?name|type|price|accessible|features/i.test(e));
    expect(unnamed, 'RBP-09: every error should name its field; these do not').toEqual([]);
  });

  test('a negative room price is refused', async ({ adminApi }) => {
    const response = await adminApi.createRoom(buildRoom({ roomPrice: -1 }));
    expect(response.status(), 'a room price below zero should be refused with 400').toBe(400);
  });

  test('admin can read a single room', { annotation: { type: 'bug', description: 'RBP-06' } }, async ({ adminApi }) => {
    const room = buildRoom();
    const roomid = await adminApi.createRoomAndGetId(room);
    const response = await adminApi.getRoom(roomid);
    expect(response.status(), `RBP-06: GET /api/room/${roomid} should return the room`).toBe(200);
    expect(await response.json()).toMatchObject({ roomName: room.roomName });
  });

  test('admin can update a room', { annotation: { type: 'bug', description: 'RBP-06' } }, async ({ adminApi }) => {
    const room = buildRoom();
    const roomid = await adminApi.createRoomAndGetId(room);
    const response = await adminApi.updateRoom(roomid, { ...room, roomPrice: 199 });
    expect(response.status(), `RBP-06: PUT /api/room/${roomid} should update the room`).toBe(200);
  });

  test('admin can delete a room and it leaves the list', { annotation: { type: 'bug', description: 'RBP-05' } }, async ({ adminApi }) => {
    const room = buildRoom();
    const roomid = await adminApi.createRoomAndGetId(room);
    const response = await adminApi.deleteRoom(roomid);
    expect(response.ok(), `RBP-05: DELETE /api/room/${roomid} should succeed, got ${response.status()}`).toBe(true);
    const { rooms } = await (await adminApi.listRooms()).json();
    expect(rooms.map((r: { roomid: number }) => r.roomid)).not.toContain(roomid);
  });
});
