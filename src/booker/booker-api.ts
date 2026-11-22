import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { readJson } from '../utils/read-json';
import type { BookerBooking, CreatedBooking } from './data';

/**
 * Client for the Restful Booker API (restful-booker.herokuapp.com/apidoc).
 *
 * - Write operations take the token explicitly, so tests can also call them with a
 *   missing or forged token.
 * - Every booking the API accepts is remembered, including invalid ones it should have
 *   refused, so the fixture can delete them after the test.
 */
export class BookerApi {
  private readonly created: number[] = [];

  constructor(private readonly request: APIRequestContext) {}

  ping(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  listBookingIds(filter?: Record<string, string>): Promise<APIResponse> {
    return this.request.get('/booking', { params: filter });
  }

  getBooking(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { headers: { Accept: 'application/json' } });
  }

  /** Accepts loosely typed bodies too, so validation tests can send wrong types. */
  async createBooking(booking: Partial<BookerBooking> | Record<string, unknown>): Promise<APIResponse> {
    const response = await this.request.post('/booking', { data: booking, headers: { Accept: 'application/json' } });
    if (response.ok()) this.created.push((await readJson<CreatedBooking>(response)).bookingid);
    return response;
  }

  /** Test setup: creates a booking, stopping with a precondition message if that fails. */
  async createBookingAndGetId(booking: BookerBooking): Promise<number> {
    const response = await this.createBooking(booking);
    expect(response.status(), `precondition: booking setup failed (${await response.text()})`).toBe(200);
    return (await readJson<CreatedBooking>(response)).bookingid;
  }

  updateBooking(id: number, booking: BookerBooking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: this.headers(token) });
  }

  patchBooking(id: number, changes: Partial<BookerBooking>, token?: string): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: changes, headers: this.headers(token) });
  }

  deleteBooking(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: this.headers(token) });
  }

  /** Best-effort deletion of every booking this client created; already-deleted ones are ignored. */
  async deleteCreated(token: string): Promise<void> {
    await Promise.allSettled(this.created.map((id) => this.deleteBooking(id, token)));
  }

  private headers(token?: string): Record<string, string> {
    return token ? { Accept: 'application/json', Cookie: `token=${token}` } : { Accept: 'application/json' };
  }
}
