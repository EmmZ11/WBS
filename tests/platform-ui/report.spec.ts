import { expect, test } from '../../src/fixtures';
import { buildRoom, type StoredBooking } from '../../src/platform/data';
import { ReportPage } from '../../src/platform/pages/report-page';
import { readJson } from '../../src/utils/read-json';
import { uniqueId } from '../../src/utils/unique-id';

// Report: a booking calendar where admin can also create bookings.
// Bookings are made two months ahead, on a fresh room, to avoid clashes.
test.describe('Platform UI: report and booking', () => {
  test('the calendar moves between months and back to today', async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    const thisMonth = await report.monthLabel.innerText();
    await report.nextMonth();
    await report.today.click();
    await expect(report.monthLabel).toHaveText(thisMonth);
  });

  test('admin can book a room from the calendar: stored and confirmed', { annotation: { type: 'bug', description: 'RBP-15' } }, async ({ page, adminApi }) => {
    const room = buildRoom();
    const roomid = await adminApi.createRoomAndGetId(room);
    const lastname = `Fictional${uniqueId()}`;

    const report = new ReportPage(page);
    await report.goto();
    await report.nextMonth(2);
    await report.selectNights('10', '11');
    await report.firstname.fill('Testa');
    await report.lastname.fill(lastname);
    await expect(report.room.locator('option', { hasText: room.roomName }),
      `precondition: room "${room.roomName}" created through the API is not offered`).toHaveCount(1);
    await report.room.selectOption({ label: room.roomName });
    const created = page.waitForResponse((r) => r.url().endsWith('/api/booking') && r.request().method() === 'POST');
    await report.book.click();
    const response = await created;
    expect(response.status()).toBe(201);
    adminApi.trackBooking((await readJson<StoredBooking>(response)).bookingid);

    // Source of truth first: the booking is stored...
    expect(await adminApi.readBookings(roomid)).toContainEqual(expect.objectContaining({ firstname: 'Testa', lastname }));

    // ...and the admin must be told it worked. Both checks are reported, even if the first fails.
    await expect.soft(report.dialog, 'RBP-15: the booking is stored, but the dialog stays open').toBeHidden();
    expect.soft((await report.messages.allInnerTexts()).join(' '), 'RBP-15: a stored booking is reported as failed')
      .not.toMatch(/failed to create booking/i);
  });

  test('booking with empty fields says which fields are wrong', { annotation: { type: 'bug', description: 'RBP-02' } }, async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    await report.nextMonth();
    await report.selectNights('10', '11');
    await report.book.click();
    await expect(report.messages.filter({ hasText: 'Firstname should not be blank' })).toBeVisible();
    const unnamed = (await report.messages.allInnerTexts()).filter((m) => !/firstname|lastname|room|deposit|check/i.test(m));
    expect(unnamed, 'RBP-02: every error should name its field; these do not').toEqual([]);
  });

  test('the booking dialog has a meaningful accessible name', { annotation: { type: 'bug', description: 'RBP-14' } }, async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    await report.nextMonth();
    await report.selectNights('10', '11');
    await expect(report.dialog, 'RBP-14: dialog is announced as "onRequestClose Example"').not.toHaveAccessibleName(/onRequestClose/);
  });
});
