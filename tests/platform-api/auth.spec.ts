import { expect, test } from '../../src/fixtures';

// Login is the gate to every admin feature, so it is tested first (test plan: Login).
test.describe('Platform API: authentication', () => {
  test('rejects an unknown user with 401 and a generic message', async ({ guestApi }) => {
    const response = await guestApi.login('not-a-user', 'not-a-password');
    expect(response.status()).toBe(401);
    // Generic wording avoids telling an attacker which half was wrong.
    expect(await response.json()).toEqual({ error: 'Invalid credentials' });
  });

  test('rejects an empty username and password with 401', async ({ guestApi }) => {
    const response = await guestApi.login('', '');
    expect(response.status()).toBe(401);
  });

  test('rejects an SQL injection attempt in the username', async ({ guestApi }) => {
    const response = await guestApi.login("' OR '1'='1", "' OR '1'='1");
    expect(response.status()).toBe(401);
  });

  test('token validation without a token returns 401', async ({ guestApi }) => {
    const response = await guestApi.validateToken();
    expect(response.status()).toBe(401);
  });

  test('token validation with a forged token is refused', async ({ guestApi }) => {
    const response = await guestApi.validateToken('forged-token-value');
    // The API answers 403 (token present but invalid). Either refusal code is acceptable;
    // what matters is that a forged token is never accepted.
    expect([401, 403]).toContain(response.status());
  });
});
