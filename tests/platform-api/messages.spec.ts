import { expect, test } from '../../src/fixtures';
import { buildMessage } from '../../src/platform/data';

// Messages are guest enquiries that admin must be able to read and act on.
// The message is created through the public endpoint only as test setup.
test.describe('Platform API: messages (admin)', () => {
  let subject = '';
  let id = 0;

  test.beforeEach(async ({ guestApi, adminApi }) => {
    const message = buildMessage();
    subject = message.subject;
    expect((await guestApi.createMessage(message)).status()).toBe(200);
    const { messages } = await (await adminApi.listMessages()).json();
    id = messages.find((m: { subject: string }) => m.subject === subject).id;
  });

  test('a new message appears in the admin list as unread', async ({ adminApi }) => {
    const { messages } = await (await adminApi.listMessages()).json();
    expect(messages).toContainEqual(expect.objectContaining({ id, subject, read: false }));
  });

  test('admin can open a message and read its full text', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ adminApi }) => {
    const response = await adminApi.getMessage(id);
    expect(response.status(), `RBP-07: GET /api/message/${id} should return the message`).toBe(200);
    expect(await response.json()).toMatchObject({ subject });
  });

  test('admin can mark a message as read', { annotation: { type: 'bug', description: 'RBP-07' } }, async ({ adminApi }) => {
    const response = await adminApi.markMessageRead(id);
    expect(response.ok(), `RBP-07: PUT /api/message/${id}/read should succeed, got ${response.status()}`).toBe(true);
  });
});
