import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { readJson } from '../utils/read-json';
import type { BookerAuth, BookerBooking, CreatedBooking } from './data';

/**
 * Client for the Restful Booker API (restful-booker.herokuapp.com/apidoc).
 *
 * - Write operations take the authorisation explicitly (a token cookie or Basic auth,
 *   the two methods the apidoc documents), so tests can also call them with none.
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

  /** GET /booking, optionally filtered by firstname, lastname, checkin or checkout. */
  listBookingIds(filter?: Record<string, string>): Promise<APIResponse> {
    return this.request.get('/booking', { params: filter });
  }

  async readBookingIds(filter?: Record<string, string>): Promise<number[]> {
    const response = await this.listBookingIds(filter);
    expect(response.status(), `precondition: GET /booking failed (${response.status()})`).toBe(200);
    return (await readJson<{ bookingid: number }[]>(response)).map((b) => b.bookingid);
  }

  getBooking(id: number, accept: 'application/json' | 'application/xml' = 'application/json'): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`, { headers: { Accept: accept } });
  }

  /** Accepts loosely typed bodies too, so validation tests can send wrong types. */
  async createBooking(booking: Partial<BookerBooking> | Record<string, unknown>): Promise<APIResponse> {
    const response = await this.request.post('/booking', { data: booking, headers: { Accept: 'application/json' } });
    if (response.ok()) this.created.push((await readJson<CreatedBooking>(response)).bookingid);
    return response;
  }

  /** POST /booking with an XML body (Content-Type: text/xml), asking for an XML response. */
  async createBookingXml(booking: BookerBooking): Promise<APIResponse> {
    const response = await this.request.post('/booking', {
      data: toXml(booking), headers: { 'Content-Type': 'text/xml', Accept: 'application/xml' },
    });
    const id = /<bookingid>(\d+)<\/bookingid>/.exec(await response.text())?.[1];
    if (response.ok() && id) this.created.push(Number(id));
    return response;
  }

  /** POST /booking with a URL-encoded form body. */
  async createBookingForm(booking: BookerBooking): Promise<APIResponse> {
    const response = await this.request.post('/booking', {
      form: {
        firstname: booking.firstname,
        lastname: booking.lastname,
        totalprice: String(booking.totalprice),
        depositpaid: String(booking.depositpaid),
        'bookingdates[checkin]': booking.bookingdates.checkin,
        'bookingdates[checkout]': booking.bookingdates.checkout,
        additionalneeds: booking.additionalneeds ?? '',
      },
      headers: { Accept: 'application/json' },
    });
    if (response.ok()) this.created.push((await readJson<CreatedBooking>(response)).bookingid);
    return response;
  }

  /** Test setup: creates a booking, stopping with a precondition message if that fails. */
  async createBookingAndGetId(booking: BookerBooking): Promise<number> {
    const response = await this.createBooking(booking);
    expect(response.status(), `precondition: booking setup failed (${await response.text()})`).toBe(200);
    return (await readJson<CreatedBooking>(response)).bookingid;
  }

  updateBooking(id: number, booking: Partial<BookerBooking>, auth?: BookerAuth): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: headersFor(auth) });
  }

  patchBooking(id: number, changes: Partial<BookerBooking>, auth?: BookerAuth): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: changes, headers: headersFor(auth) });
  }

  deleteBooking(id: number, auth?: BookerAuth): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: headersFor(auth) });
  }

  /** Best-effort deletion of every booking this client created; already-deleted ones are ignored. */
  async deleteCreated(token: string): Promise<void> {
    await Promise.allSettled(this.created.map((id) => this.deleteBooking(id, { token })));
  }
}

function headersFor(auth?: BookerAuth): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (auth && 'token' in auth) headers.Cookie = `token=${auth.token}`;
  if (auth && 'username' in auth) {
    headers.Authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`;
  }
  return headers;
}

function toXml(b: BookerBooking): string {
  return `<booking><firstname>${b.firstname}</firstname><lastname>${b.lastname}</lastname>`
    + `<totalprice>${b.totalprice}</totalprice><depositpaid>${b.depositpaid}</depositpaid>`
    + `<bookingdates><checkin>${b.bookingdates.checkin}</checkin><checkout>${b.bookingdates.checkout}</checkout></bookingdates>`
    + `<additionalneeds>${b.additionalneeds ?? ''}</additionalneeds></booking>`;
}
