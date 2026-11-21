import type { Locator, Page } from '@playwright/test';

/** Admin Report page (/admin/report): booking calendar and the booking dialog. */
export class ReportPage {
  readonly today: Locator;
  readonly back: Locator;
  readonly next: Locator;
  readonly monthLabel: Locator;
  readonly dialog: Locator;
  readonly firstname: Locator;
  readonly lastname: Locator;
  readonly room: Locator;
  readonly depositPaid: Locator;
  readonly book: Locator;
  readonly cancel: Locator;
  /** Messages the dialog shows after Book (every paragraph except the check-in/out dates). */
  readonly messages: Locator;

  constructor(private readonly page: Page) {
    this.today = page.getByRole('button', { name: 'Today' });
    this.back = page.getByRole('button', { name: 'Back' });
    this.next = page.getByRole('button', { name: 'Next' });
    this.monthLabel = page.locator('.rbc-toolbar-label');
    this.dialog = page.getByRole('dialog');
    this.firstname = this.dialog.getByPlaceholder('Firstname');
    this.lastname = this.dialog.getByPlaceholder('Lastname');
    this.room = this.dialog.locator('#roomid');
    this.depositPaid = this.dialog.locator('#depositpaid');
    this.book = this.dialog.getByRole('button', { name: 'Book' });
    this.cancel = this.dialog.getByRole('button', { name: 'Cancel' });
    this.messages = this.dialog.locator('p').filter({ hasNotText: /^Check(in|out):/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/report');
    await this.monthLabel.waitFor();
  }

  /** Selects nights by dragging across day cells of the visible month (day numbers as shown). */
  async selectNights(firstDay: string, lastDay: string): Promise<void> {
    const cell = (day: string) => this.page.locator('.rbc-month-view').getByRole('cell', { name: day, exact: true }).first();
    const from = await cell(firstDay).boundingBox();
    const to = await cell(lastDay).boundingBox();
    if (!from || !to) throw new Error(`Day cells ${firstDay}/${lastDay} not visible`);
    await this.page.mouse.move(from.x + from.width / 2, from.y + from.height * 0.7);
    await this.page.mouse.down();
    await this.page.mouse.move(to.x + to.width / 2, to.y + to.height * 0.7, { steps: 8 });
    await this.page.mouse.up();
    await this.dialog.waitFor();
  }
}
