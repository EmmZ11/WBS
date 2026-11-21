import type { Locator, Page } from '@playwright/test';

/** Top navigation shown on every admin page after login. */
export class AdminNav {
  readonly rooms: Locator;
  readonly report: Locator;
  readonly branding: Locator;
  readonly messages: Locator;
  readonly logout: Locator;

  constructor(page: Page) {
    const nav = page.getByRole('navigation');
    this.rooms = nav.getByRole('link', { name: 'Rooms' });
    this.report = nav.getByRole('link', { name: 'Report' });
    this.branding = nav.getByRole('link', { name: 'Branding' });
    this.messages = nav.getByRole('link', { name: /^Messages/ });
    this.logout = nav.getByRole('button', { name: 'Logout' });
  }
}
