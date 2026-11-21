// Fictional test data only. Every value carries a unique suffix so parallel runs,
// and other people using the shared demo site, never collide with our records.

let counter = 0;
export function uniqueId(): string {
  counter += 1;
  return `${Date.now().toString(36)}${counter}`.slice(-8);
}

export interface Room {
  roomName: string;
  type: 'Single' | 'Twin' | 'Double' | 'Family' | 'Suite';
  accessible: boolean;
  roomPrice: number;
  features: string[];
  description?: string;
  image?: string;
}

export function buildRoom(overrides: Partial<Room> = {}): Room {
  return {
    roomName: `QA${uniqueId()}`,
    type: 'Single',
    accessible: false,
    roomPrice: 120,
    features: ['WiFi'],
    description: 'Fictional room created by an automated test.',
    image: '/images/room1.jpg',
    ...overrides,
  };
}

export interface Booking {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  email: string;
  phone: string;
  bookingdates: { checkin: string; checkout: string };
}

/** ISO date (yyyy-mm-dd) a number of days from today. */
export function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export function buildBooking(roomid: number, overrides: Partial<Booking> = {}): Booking {
  return {
    roomid,
    firstname: 'Testa',
    lastname: `Fictional${uniqueId()}`,
    depositpaid: false,
    email: 'testa.fictional@example.com',
    phone: '01234567890',
    bookingdates: { checkin: isoDate(30), checkout: isoDate(32) },
    ...overrides,
  };
}

export interface Message {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    name: 'Testa Fictional',
    email: 'testa.fictional@example.com',
    phone: '01234567890',
    subject: `QA enquiry ${uniqueId()}`,
    description: 'This is a fictional message created by an automated test.',
    ...overrides,
  };
}
