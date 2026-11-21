import { existsSync } from 'node:fs';

// Load .env for local runs. In CI the same values come from GitHub secrets.
if (existsSync('.env')) process.loadEnvFile('.env');

/** Restful Booker Platform: admin UI and the API behind it (the test plan's main scope). */
export const BASE_URL = process.env.BASE_URL ?? 'https://automationintesting.online';

/** Restful Booker API (the brief's Option A). */
export const BOOKER_BASE_URL = process.env.BOOKER_BASE_URL ?? 'https://restful-booker.herokuapp.com';

/** Where the setup project saves the admin session (git-ignored). */
export const ADMIN_STATE = 'playwright/.auth/admin.json';

function required(userVar: string, passVar: string): { username: string; password: string } {
  const username = process.env[userVar];
  const password = process.env[passVar];
  if (!username || !password) {
    throw new Error(`${userVar} and ${passVar} must be set (see .env.example).`);
  }
  return { username, password };
}

export const adminCredentials = () => required('ADMIN_USERNAME', 'ADMIN_PASSWORD');
export const bookerCredentials = () => required('BOOKER_USERNAME', 'BOOKER_PASSWORD');
