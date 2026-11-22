import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { readJson } from '../utils/read-json';
import type {
  Booking, Branding, Message, MessageSummary, ReportEntry, Room, StoredBooking, StoredRoom,
} from './data';

/**
 * Client for the Restful Booker Platform API.
 *
 * - Endpoint methods (listRooms, createRoom, ...) return the raw response, so tests
 *   assert status codes and bodies themselves, including the negative cases.
 * - read* methods return typed data for checking what is stored (the source of truth).
 * - create*AndGetId methods are test setup: they stop with a "precondition:" message if
 *   setup fails, and remember what they created so the fixture can clean it up.
 */
export class PlatformApi {
  private readonly created: { rooms: number[]; bookings: number[]; messages: number[] } = {
    rooms: [], bookings: [], messages: [],
  };

  constructor(private readonly request: APIRequestContext) {}

  // ---- Auth -----------------------------------------------------------------------

  login(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/api/auth/login', { data: { username, password } });
  }

  validateToken(token?: string): Promise<APIResponse> {
    return this.request.post('/api/auth/validate', { data: token ? { token } : {} });
  }

  logout(token: string): Promise<APIResponse> {
    return this.request.post('/api/auth/logout', { data: { token }, headers: { Cookie: `token=${token}` } });
  }

  // ---- Rooms ----------------------------------------------------------------------

  listRooms(): Promise<APIResponse> {
    return this.request.get('/api/room');
  }

  getRoom(roomid: number): Promise<APIResponse> {
    return this.request.get(`/api/room/${roomid}`);
  }

  createRoom(room: Partial<Room>): Promise<APIResponse> {
    return this.request.post('/api/room', { data: room });
  }

  updateRoom(roomid: number, room: Partial<Room>): Promise<APIResponse> {
    return this.request.put(`/api/room/${roomid}`, { data: { roomid, ...room } });
  }

  deleteRoom(roomid: number): Promise<APIResponse> {
    return this.request.delete(`/api/room/${roomid}`);
  }

  async readRooms(): Promise<StoredRoom[]> {
    return (await readJson<{ rooms: StoredRoom[] }>(await this.listRooms())).rooms;
  }

  /**
   * Creates a room and returns its id. POST /api/room only answers {"success":true},
   * so the id is found by the room's unique name; the list can lag briefly, so it is polled.
   */
  async createRoomAndGetId(room: Room): Promise<number> {
    const created = await this.createRoom(room);
    expect(created.status(), `precondition: room setup failed (${await created.text()})`).toBe(200);
    let roomid: number | undefined;
    await expect.poll(async () => {
      roomid = (await this.readRooms()).find((r) => r.roomName === room.roomName)?.roomid;
      return roomid;
    }, { message: `precondition: room "${room.roomName}" not listed after creation`, timeout: 15_000 }).toBeDefined();
    this.created.rooms.push(roomid!);
    return roomid!;
  }

  // ---- Bookings -------------------------------------------------------------------

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

  async readBookings(roomid: number): Promise<StoredBooking[]> {
    return (await readJson<{ bookings: StoredBooking[] }>(await this.listBookings(roomid))).bookings;
  }

  async createBookingAndGetId(booking: Booking): Promise<number> {
    const created = await this.createBooking(booking);
    expect(created.status(), `precondition: booking setup failed (${await created.text()})`).toBe(201);
    const { bookingid } = await readJson<StoredBooking>(created);
    this.created.bookings.push(bookingid);
    return bookingid;
  }

  /** Remembers a booking created another way (for example through the UI) for clean-up. */
  trackBooking(bookingid: number): void {
    this.created.bookings.push(bookingid);
  }

  // ---- Messages -------------------------------------------------------------------

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

  async readMessages(): Promise<MessageSummary[]> {
    return (await readJson<{ messages: MessageSummary[] }>(await this.listMessages())).messages;
  }

  /** Sends a guest message (the public endpoint) and returns its id from the admin list. */
  async createMessageAndGetId(message: Message): Promise<number> {
    const created = await this.createMessage(message);
    expect(created.status(), `precondition: message setup failed (${await created.text()})`).toBe(200);
    let id: number | undefined;
    await expect.poll(async () => {
      id = (await this.readMessages()).find((m) => m.subject === message.subject)?.id;
      return id;
    }, { message: `precondition: message "${message.subject}" not listed after creation`, timeout: 15_000 }).toBeDefined();
    this.created.messages.push(id!);
    return id!;
  }

  // ---- Branding and report --------------------------------------------------------

  getBranding(): Promise<APIResponse> {
    return this.request.get('/api/branding');
  }

  updateBranding(branding: Branding): Promise<APIResponse> {
    return this.request.put('/api/branding', { data: branding });
  }

  async readBranding(): Promise<Branding> {
    return readJson<Branding>(await this.getBranding());
  }

  getReport(): Promise<APIResponse> {
    return this.request.get('/api/report');
  }

  async readReport(): Promise<ReportEntry[]> {
    return (await readJson<{ report: ReportEntry[] }>(await this.getReport())).report;
  }

  // ---- Clean-up -------------------------------------------------------------------

  /**
   * Best-effort removal of everything this client created. Failures are ignored:
   * deletion is currently broken on the platform (RBP-05, RBP-07, RBP-08) and the site
   * also resets on a schedule. Once those bugs are fixed, tests stop leaving data behind.
   */
  async deleteCreated(): Promise<void> {
    const attempts = [
      ...this.created.bookings.map((id) => this.deleteBooking(id)),
      ...this.created.messages.map((id) => this.deleteMessage(id)),
      ...this.created.rooms.map((id) => this.deleteRoom(id)),
    ];
    await Promise.allSettled(attempts);
  }
}
