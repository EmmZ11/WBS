// Fictional test data for the Restful Booker API, and the shapes it returns.
// A random last name lets each test find its own booking on a shared, public service.
import { uniqueId } from '../utils/unique-id';

export interface BookerBooking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

export interface CreatedBooking {
  bookingid: number;
  booking: BookerBooking;
}

/** The two ways the apidoc allows a write to be authorised: a token cookie or Basic auth. */
export type BookerAuth = { token: string } | { username: string; password: string };

export interface TokenResponse {
  token?: string;
  reason?: string;
}

export function buildBookerBooking(overrides: Partial<BookerBooking> = {}): BookerBooking {
  return {
    firstname: 'Testa',
    lastname: `Fictional${uniqueId()}`,
    totalprice: 240,
    depositpaid: true,
    bookingdates: { checkin: '2027-06-01', checkout: '2027-06-04' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
