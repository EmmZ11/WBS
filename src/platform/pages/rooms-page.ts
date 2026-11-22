import { expect, type Locator, type Page } from '@playwright/test';
import type { Room } from '../data';

/**
 * Admin Rooms page (/admin/rooms): room list and the create-room form.
 * The form inputs have no labels (RBP-14), so they are located by id.
 */
export class RoomsPage {
  readonly roomName: Locator;
  readonly type: Locator;
  readonly accessible: Locator;
  readonly price: Locator;
  readonly create: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.roomName = page.locator('#roomName');
    this.type = page.locator('#type');
    this.accessible = page.locator('#accessible');
    this.price = page.locator('#roomPrice');
    this.create = page.getByRole('button', { name: 'Create' });
    // Error box is a .alert div. getByRole('alert') would also match Next.js's empty route announcer.
    this.error = page.locator('.alert').filter({ hasText: /\S/ });
  }

  /** Opens the page and waits for the room list to load from the API. */
  async goto(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.url().endsWith('/api/room') && r.request().method() === 'GET'),
      this.page.goto('/admin/rooms'),
    ]);
  }

  /**
   * Opens the page and waits for a room that was just created through the API.
   * The list can lag behind the API, so the page is reloaded until the room shows.
   * If it never shows (for example the demo reset its data), the test stops with a
   * precondition message, so it is never mistaken for a product defect.
   */
  async gotoWithRoom(roomid: number): Promise<void> {
    await this.goto();
    await expect(async () => {
      await this.page.reload();
      await expect(this.rowById(roomid)).toBeVisible({ timeout: 3_000 });
    }, `precondition: room ${roomid} created through the API is not listed`).toPass({ timeout: 20_000 });
  }

  /** Row by visible room name, as a user finds it. */
  row(roomName: string): Locator {
    return this.page.getByTestId('roomlisting').filter({ has: this.page.getByText(roomName, { exact: true }) });
  }

  /** Row by room id (each row has id="room{id}"), independent of how the name renders. */
  rowById(roomid: number): Locator {
    return this.page.locator(`[data-testid="roomlisting"]#room${roomid}`);
  }

  async createRoom(room: Room): Promise<void> {
    await this.roomName.fill(room.roomName);
    await this.type.selectOption(room.type);
    await this.accessible.selectOption(String(room.accessible));
    await this.price.fill(String(room.roomPrice));
    for (const feature of room.features) await this.page.getByLabel(feature, { exact: true }).check();
    await this.create.click();
  }

  async delete(roomid: number): Promise<void> {
    await this.rowById(roomid).locator('.roomDelete').click();
  }

  async open(roomid: number): Promise<void> {
    await this.rowById(roomid).locator('p').first().click();
  }
}
