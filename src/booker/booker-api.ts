import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { BookerBooking } from './data';

/**
 * Thin wrapper over the Restful Booker API (restful-booker.herokuapp.com/apidoc).
 * Write operations take the token explicitly, so tests can also call them
 * with a missing or forged token.
 */
export class BookerApi {
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

  createBooking(booking: Partial<BookerBooking>): Promise<APIResponse> {
    return this.request.post('/booking', { data: booking, headers: { Accept: 'application/json' } });
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

  private headers(token?: string): Record<string, string> {
    return token ? { Accept: 'application/json', Cookie: `token=${token}` } : { Accept: 'application/json' };
  }
}
