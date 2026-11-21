// Fictional test data for the Restful Booker API. A unique last name lets each
// test find its own booking on a shared, public service.

export interface BookerBooking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
}

let counter = 0;
function uniqueSuffix(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`;
}

export function buildBookerBooking(overrides: Partial<BookerBooking> = {}): BookerBooking {
  return {
    firstname: 'Testa',
    lastname: `Fictional${uniqueSuffix()}`,
    totalprice: 240,
    depositpaid: true,
    bookingdates: { checkin: '2027-06-01', checkout: '2027-06-04' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
