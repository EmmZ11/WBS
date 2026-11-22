import { expect, type Locator, type Page } from '@playwright/test';

/** Admin Report page (/admin/report): booking calendar and the booking dialog. */
export class ReportPage {
  readonly today: Locator;
  readonly next: Locator;
  readonly monthLabel: Locator;
  readonly dialog: Locator;
  readonly firstname: Locator;
  readonly lastname: Locator;
  readonly room: Locator;
  readonly book: Locator;
  /** Messages the dialog shows after Book (every paragraph except the check-in/out dates). */
  readonly messages: Locator;

  constructor(private readonly page: Page) {
    this.today = page.getByRole('button', { name: 'Today' });
    this.next = page.getByRole('button', { name: 'Next' });
    // The calendar's month heading has no role or label; this class is the calendar library's.
    this.monthLabel = page.locator('.rbc-toolbar-label');
    this.dialog = page.getByRole('dialog');
    this.firstname = this.dialog.getByPlaceholder('Firstname');
    this.lastname = this.dialog.getByPlaceholder('Lastname');
    this.room = this.dialog.locator('#roomid');
    this.book = this.dialog.getByRole('button', { name: 'Book' });
    this.messages = this.dialog.locator('p').filter({ hasNotText: /^Check(in|out):/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/report');
    await expect(this.monthLabel).toBeVisible();
  }

  /** Moves the calendar forward by a number of months, waiting for each change. */
  async nextMonth(times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      const current = await this.monthLabel.innerText();
      await this.next.click();
      await expect(this.monthLabel).not.toHaveText(current);
    }
  }

  /**
   * Selects nights by dragging across day cells of the visible month. Use mid-month days
   * (10-20): days near the start or end also appear for the neighbouring month.
   */
  async selectNights(firstDay: string, lastDay: string): Promise<void> {
    const cell = (day: string) => this.page.locator('.rbc-month-view').getByRole('cell', { name: day, exact: true }).first();
    const from = await cell(firstDay).boundingBox();
    const to = await cell(lastDay).boundingBox();
    if (!from || !to) throw new Error(`Day cells ${firstDay}/${lastDay} not visible`);
    // Press in the lower part of the cell: the top holds the day-number button, and
    // pressing that would hit the button instead of the cell that starts the selection.
    const pointIn = (box: { x: number; y: number; width: number; height: number }) =>
      [box.x + box.width / 2, box.y + box.height * 0.7] as const;
    await this.page.mouse.move(...pointIn(from));
    await this.page.mouse.down();
    await this.page.mouse.move(...pointIn(to), { steps: 8 });
    await this.page.mouse.up();
    await expect(this.dialog).toBeVisible();
  }
}
