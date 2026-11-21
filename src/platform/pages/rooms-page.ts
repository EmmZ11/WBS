import { expect, type Locator, type Page } from '@playwright/test';
import type { Room } from '../data';

/**
 * Admin Rooms page (/admin/rooms): room list and the create-room form.
 * The form inputs have no visible labels (RBP-14), so they are located by id.
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
    // The error box is a plain .alert div (the page's role="alert" element is Next.js's route announcer).
    this.error = page.locator('.alert').filter({ hasText: /\S/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/rooms');
  }

  /**
   * Opens the Rooms page and waits for a room that was just created through the API.
   * The list can lag behind the API for a moment, so the page is reloaded until the
   * room shows. If it never shows (for example the demo site reset its data), the test
   * stops here with a precondition message, so it is never mistaken for a product defect.
   */
  async gotoWithRoom(roomName: string): Promise<void> {
    await this.goto();
    await expect(async () => {
      await this.page.reload();
      await expect(this.row(roomName)).toBeVisible({ timeout: 3_000 });
    }, `precondition: room "${roomName}" created through the API is not listed`).toPass({ timeout: 20_000 });
  }

  row(roomName: string): Locator {
    return this.page.getByTestId('roomlisting').filter({ has: this.page.getByText(roomName, { exact: true }) });
  }

  async createRoom(room: Room): Promise<void> {
    await this.roomName.fill(room.roomName);
    await this.type.selectOption(room.type);
    await this.accessible.selectOption(String(room.accessible));
    await this.price.fill(String(room.roomPrice));
    for (const feature of room.features) await this.page.getByLabel(feature, { exact: true }).check();
    await this.create.click();
  }

  async delete(roomName: string): Promise<void> {
    await this.row(roomName).locator('.roomDelete').click();
  }

  async open(roomName: string): Promise<void> {
    await this.row(roomName).locator('p').first().click();
  }
}
