// Fictional test data for the Restful Booker Platform, and the shapes its API returns.
// Names, last names and subjects carry a random id, so each test can find its own
// records on a shared site.
import { uniqueId } from '../utils/unique-id';

// ---- Request bodies -------------------------------------------------------------

export interface Room {
  roomName: string;
  type: 'Single' | 'Twin' | 'Double' | 'Family' | 'Suite';
  accessible: boolean;
  roomPrice: number;
  features: string[];
  description?: string;
  image?: string;
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

export interface Message {
  name: string;
  email: string;
  phone: string;
  subject: string;
  description: string;
}

// ---- Response bodies ------------------------------------------------------------

export interface StoredRoom extends Room {
  roomid: number;
}

export interface StoredBooking extends Omit<Booking, 'email' | 'phone'> {
  bookingid: number;
}

export interface MessageSummary {
  id: number;
  name: string;
  subject: string;
  read: boolean;
}

export interface ReportEntry {
  start: string;
  end: string;
  title: string;
}

export interface Branding {
  name: string;
  logoUrl: string;
  description: string;
  directions: string;
  map: { latitude: number; longitude: number };
  contact: { name: string; phone: string; email: string };
  address: { line1: string; line2: string; postTown: string; county: string; postCode: string };
}

/** Error body for validation failures on rooms and bookings. */
export interface ValidationErrors {
  errors: string[];
}

// ---- Builders -------------------------------------------------------------------

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
