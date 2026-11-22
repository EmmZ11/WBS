import { expect, test } from '../../src/fixtures';
import { buildMessage, type Message } from '../../src/platform/data';
import { MessagesPage } from '../../src/platform/pages/messages-page';

// Messages: admin must see new guest enquiries and be able to read them.
test.describe('Platform UI: messages', () => {
  let message: Message;

  test.beforeEach(async ({ adminApi }) => {
    message = buildMessage();
    await adminApi.createMessageAndGetId(message);
  });

  test('a new guest message is listed with its sender and subject', async ({ page }) => {
    const messages = new MessagesPage(page);
    await messages.goto();
    await expect(messages.row(message.subject)).toContainText(message.name);
  });

  test('opening a message shows its full text', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ page }) => {
    const messages = new MessagesPage(page);
    await messages.goto();
    await expect(messages.row(message.subject), `precondition: message "${message.subject}" is not listed`).toBeVisible();
    await messages.open(message.subject);
    await expect(messages.viewer, 'RBP-07: nothing opens (GET /api/message/{id} returns 500)').toContainText(message.description);
  });
});
