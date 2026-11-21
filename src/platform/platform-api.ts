import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking, Message, Room } from './data';

/**
 * Thin wrapper over the Restful Booker Platform API.
 * Methods return the raw APIResponse so each test makes its own assertions
 * on status codes and bodies, including the negative cases.
 */
export class PlatformApi {
  constructor(private readonly request: APIRequestContext) {}

  // Auth
  login(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { username, password } });
  }

  validateToken(token?: string): Promise<APIResponse> {
    return this.request.post('/api/auth/validate', { data: token ? { token } : {} });
  }

  logout(token: string): Promise<APIResponse> {
    return this.request.post('/api/auth/logout', { data: { token }, headers: { Cookie: `token=${token}` } });
  }

  // Rooms
  listRooms(): Promise<APIResponse> {
    return this.request.get('/api/room');
  }

  getRoom(roomid: number): Promise<APIResponse> {
    return this.request.get(`/api/room/${roomid}`);
  }

  createRoom(room: Partial<Room>): Promise<APIResponse> {
    return this.request.post('/api/room', { data: room });
  }

  /**
   * Creates a room and returns its id. POST /api/room only answers {"success":true},
   * so the id is found by the room's unique name in the room list.
   */
  async createRoomAndGetId(room: Room): Promise<number> {
    const created = await this.createRoom(room);
    if (created.status() !== 200) throw new Error(`Room setup failed: ${created.status()} ${await created.text()}`);
    const { rooms } = await (await this.listRooms()).json();
    const match = rooms.find((r: { roomName: string }) => r.roomName === room.roomName);
    if (!match) throw new Error(`Room ${room.roomName} not found after creation`);
    return match.roomid;
  }

  updateRoom(roomid: number, room: Partial<Room>): Promise<APIResponse> {
    return this.request.put(`/api/room/${roomid}`, { data: { roomid, ...room } });
  }

  deleteRoom(roomid: number): Promise<APIResponse> {
    return this.request.delete(`/api/room/${roomid}`);
  }

  // Bookings
  listBookings(roomid?: number): Promise<APIResponse> {
    return this.request.get('/api/booking', { params: roomid ? { roomid } : undefined });
  }

  createBooking(booking: Partial<Booking>): Promise<APIResponse> {
    return this.request.post('/api/booking', { data: booking });
  }

  getBooking(bookingid: number): Promise<APIResponse> {
    return this.request.get(`/api/booking/${bookingid}`);
  }

  deleteBooking(bookingid: number): Promise<APIResponse> {
    return this.request.delete(`/api/booking/${bookingid}`);
  }

  // Messages
  listMessages(): Promise<APIResponse> {
    return this.request.get('/api/message');
  }

  getMessage(id: number): Promise<APIResponse> {
    return this.request.get(`/api/message/${id}`);
  }

  createMessage(message: Partial<Message>): Promise<APIResponse> {
    return this.request.post('/api/message', { data: message });
  }

  markMessageRead(id: number): Promise<APIResponse> {
    return this.request.put(`/api/message/${id}/read`);
  }

  deleteMessage(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/message/${id}`);
  }

  // Branding and report
  getBranding(): Promise<APIResponse> {
    return this.request.get('/api/branding');
  }

  updateBranding(branding: unknown): Promise<APIResponse> {
    return this.request.put('/api/branding', { data: branding });
  }

  getReport(): Promise<APIResponse> {
    return this.request.get('/api/report');
  }
}
