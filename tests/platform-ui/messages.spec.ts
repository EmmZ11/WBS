import { expect, test } from '../../src/fixtures';
import { buildMessage } from '../../src/platform/data';
import { MessagesPage } from '../../src/platform/pages/messages-page';

// Messages: admin must see new guest enquiries and be able to read them.
test.describe('Platform UI: messages', () => {
  let subject = '';

  test.beforeEach(async ({ guestApi }) => {
    const message = buildMessage();
    subject = message.subject;
    expect((await guestApi.createMessage(message)).status()).toBe(200);
  });

  test('a new guest message is listed with its sender and subject', async ({ page }) => {
    const messages = new MessagesPage(page);
    await messages.goto();
    await expect(messages.row(subject)).toContainText('Testa Fictional');
  });

  test('opening a message shows its full text', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ page }) => {
    const messages = new MessagesPage(page);
    await messages.goto();
    await messages.open(subject);
    await expect(messages.viewer, 'RBP-07: nothing opens (GET /api/message/{id} returns 500)').toContainText(
      'This is a fictional message created by an automated test.',
    );
  });
});
