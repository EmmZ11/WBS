import { randomUUID } from 'node:crypto';

/**
 * Short random id for test data names. Random rather than time-based, so parallel
 * workers (and other people using the shared demo sites) never produce the same value.
 */
export function uniqueId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 10);
}
