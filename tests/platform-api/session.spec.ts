import { expect, test } from '../../src/fixtures';
import { adminCredentials } from '../../src/config';

// OWASP A07 (identification and authentication failures): a session must end at logout.
// Uses its own fresh login so the shared admin session is not affected.
test.describe('Platform API: session handling', () => {
  test('a token stops working after logout', { annotation: { type: 'bug', description: 'RBP-12' } }, async ({ guestApi }) => {
    const { username, password } = adminCredentials();
    const { token } = await (await guestApi.login(username, password)).json();
    expect((await guestApi.validateToken(token)).status()).toBe(200);

    expect((await guestApi.logout(token)).status()).toBe(200);

    const after = await guestApi.validateToken(token);
    expect([401, 403], `RBP-12: token still valid after logout (got ${after.status()})`).toContain(after.status());
  });
});
