import { expect, test } from '../../src/fixtures';
import { buildMessage, type Message } from '../../src/platform/data';

// Messages are guest enquiries that admin must be able to read and act on.
// Each test sends its own message through the public endpoint as setup.
test.describe('Platform API: messages (admin)', () => {
  let message: Message;
  let id = 0;

  test.beforeEach(async ({ adminApi }) => {
    message = buildMessage();
    id = await adminApi.createMessageAndGetId(message);
  });

  test('a new message appears in the admin list as unread', async ({ adminApi }) => {
    expect(await adminApi.readMessages()).toContainEqual(
      expect.objectContaining({ id, name: message.name, subject: message.subject, read: false }),
    );
  });

  test('admin can open a message and read its full text', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ adminApi }) => {
    const response = await adminApi.getMessage(id);
    expect(response.status(), `RBP-07: GET /api/message/${id} should return the message`).toBe(200);
    expect(await response.json()).toMatchObject({ subject: message.subject, description: message.description });
  });

  test('admin can mark a message as read', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ adminApi }) => {
    const response = await adminApi.markMessageRead(id);
    expect(response.ok(), `RBP-07: PUT /api/message/${id}/read should succeed, got ${response.status()}`).toBe(true);
    expect(await adminApi.readMessages()).toContainEqual(expect.objectContaining({ id, read: true }));
  });
});
