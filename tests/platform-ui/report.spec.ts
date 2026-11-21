import { expect, test } from '../../src/fixtures';
import { buildRoom, uniqueId } from '../../src/platform/data';
import { ReportPage } from '../../src/platform/pages/report-page';

// Report: a booking calendar where admin can also create bookings.
// Bookings are made two months ahead, on a fresh room, to avoid clashes.
test.describe('Platform UI: report and booking', () => {
  test('the calendar moves between months and back to today', async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    const thisMonth = await report.monthLabel.innerText();
    await report.next.click();
    await expect(report.monthLabel).not.toHaveText(thisMonth);
    await report.today.click();
    await expect(report.monthLabel).toHaveText(thisMonth);
  });

  test('admin can book a room from the calendar: stored and confirmed', { annotation: { type: 'bug', description: 'RBP-15' } }, async ({ page, adminApi }) => {
    const room = buildRoom();
    const roomid = await adminApi.createRoomAndGetId(room);
    const lastname = `Fictional${uniqueId()}`;

    const report = new ReportPage(page);
    await report.goto();
    await report.next.click();
    await report.next.click();
    await report.selectNights('10', '11');
    await report.firstname.fill('Testa');
    await report.lastname.fill(lastname);
    await report.room.selectOption({ label: room.roomName });
    const created = page.waitForResponse((r) => r.url().endsWith('/api/booking') && r.request().method() === 'POST');
    await report.book.click();
    expect((await created).status()).toBe(201);

    // Source of truth first: the booking is stored...
    const { bookings } = await (await adminApi.listBookings(roomid)).json();
    expect(bookings).toContainEqual(expect.objectContaining({ firstname: 'Testa', lastname }));

    // ...and the admin must be told it worked.
    await expect(report.dialog, 'RBP-15: the booking is stored, but the dialog stays open').toBeHidden();
    expect(await report.messages.allInnerTexts(), 'RBP-15: a stored booking is reported as failed').not.toContain('Failed to create booking');
  });

  test('booking with empty fields says which fields are wrong', { annotation: { type: 'bug', description: 'RBP-02' } }, async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    await report.next.click();
    await report.selectNights('10', '11');
    await report.book.click();
    await expect(report.messages.filter({ hasText: 'Firstname should not be blank' })).toBeVisible();
    const unnamed = (await report.messages.allInnerTexts()).filter((m) => !/firstname|lastname|room|deposit|check/i.test(m));
    expect(unnamed, 'RBP-02: every error should name its field; these do not').toEqual([]);
  });

  test('the booking dialog has a meaningful accessible name', { annotation: { type: 'bug', description: 'RBP-14' } }, async ({ page }) => {
    const report = new ReportPage(page);
    await report.goto();
    await report.next.click();
    await report.selectNights('10', '11');
    await expect(report.dialog, 'RBP-14: dialog is announced as "onRequestClose Example"').not.toHaveAccessibleName(/onRequestClose/);
  });
});
