// @ts-check
import { test, expect } from '../fixtures/fixtures.js';
import { LOGIN_PATH, LOGIN_API } from '../pages/LoginPage.js';
import { DASHBOARD_PATH } from '../pages/DashboardPage.js';

// Messages observed on the live app (API: POST /dashboard/auth/login/).
const MSG = {
  usernameRequired: 'Username is required',
  passwordRequired: 'Password is required',
  invalidCredentials: 'Invalid Credentials',
};

const unregisteredUsername = () => `qa_unregistered_${Date.now()}`;

test.describe('Login page - UI', () => {
  test('TC01 login page loads successfully', async ({ loginPage }) => {
    const response = await loginPage.goto();
    expect(response?.ok()).toBeTruthy();
    await loginPage.expectOnLoginPage();
  });

  test('TC02 shows title, heading, username, password and Log in button', async ({ page, loginPage }) => {
    await loginPage.goto();
    await expect(page).toHaveTitle('Tharwah');
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.usernameInput).toBeEditable();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeEditable();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('TC09 password is masked and the visibility toggle works', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.passwordInput.fill('Secret#123');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.passwordToggle.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC10 inputs are marked required and errors are exposed accessibly', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.usernameInput).toHaveAttribute('required', '');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');

    await loginPage.submit();
    await expect(loginPage.usernameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(loginPage.usernameInput).toHaveAccessibleDescription(MSG.usernameRequired);

    // Error clears once the user starts typing.
    await loginPage.usernameInput.fill('a');
    await expect(loginPage.fieldError('username')).toBeHidden();
  });

  test('TC10b whitespace-only username is rejected', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.usernameInput.fill('   ');
    await loginPage.passwordInput.fill('   ');
    const response = await loginPage.submit();
    expect(response.status()).toBe(400);
    await expect(loginPage.fieldError('username')).toHaveText(MSG.usernameRequired);
    await loginPage.expectOnLoginPage();
  });
});

test.describe('Login page - negative submissions', () => {
  test('TC06 both fields empty shows "Username is required"', async ({ loginPage }) => {
    await loginPage.goto();
    const response = await loginPage.submit();
    expect(response.status()).toBe(400);
    await expect(loginPage.fieldError('username')).toHaveText(MSG.usernameRequired);
    await loginPage.expectOnLoginPage();
  });

  test('TC07 only username entered shows "Password is required"', async ({ loginPage }) => {
    await loginPage.goto();
    const response = await loginPage.login(unregisteredUsername(), '');
    expect(response.status()).toBe(400);
    await expect(loginPage.fieldError('password')).toHaveText(MSG.passwordRequired);
    await expect(loginPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
    await loginPage.expectOnLoginPage();
  });

  test('TC08 only password entered shows "Username is required"', async ({ loginPage }) => {
    await loginPage.goto();
    const response = await loginPage.login('', 'SomePassword#1');
    expect(response.status()).toBe(400);
    await expect(loginPage.fieldError('username')).toHaveText(MSG.usernameRequired);
    await loginPage.expectOnLoginPage();
  });

  test('TC05 unregistered username is rejected', async ({ page, loginPage }) => {
    await loginPage.goto();
    const response = await loginPage.login(unregisteredUsername(), 'WrongPass#123');
    expect(response.status()).toBe(400);
    await expect(loginPage.fieldError('password')).toHaveText(MSG.invalidCredentials);
    await loginPage.expectOnLoginPage();
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  });

  // Single wrong-password attempt per run against the real account, to avoid triggering lockout.
  test('TC04 + TC11 invalid password shows the same generic error as an unknown user', async ({ page, loginPage, credentials }) => {
    await loginPage.goto();
    const response = await loginPage.login(credentials.username, `${credentials.password}_wrong`);
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    // Same message for wrong password and unknown user => no username enumeration.
    expect(body.message).toBe(MSG.invalidCredentials);
    await expect(loginPage.fieldError('password')).toHaveText(MSG.invalidCredentials);
    await loginPage.expectOnLoginPage();
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  });
});

test.describe('Login - authentication and session', () => {
  test('TC03 + TC12 valid credentials log in and redirect to the dashboard', async ({ loginPage, dashboardPage, credentials }) => {
    await loginPage.goto();
    const response = await loginPage.login(credentials.username, credentials.password);
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
    await dashboardPage.expectLoaded();
  });

  test('TC14a session persists across a page reload', async ({ page, loginPage, dashboardPage, credentials }) => {
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await dashboardPage.expectLoaded();
    await page.reload();
    await dashboardPage.expectLoaded();
  });

  test('TC14b Sign Out ends the session and protected routes are no longer reachable', async ({ page, loginPage, dashboardPage, credentials }) => {
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await dashboardPage.expectLoaded();

    const logoutResponse = await dashboardPage.signOut();
    expect(logoutResponse.ok()).toBeTruthy();
    await loginPage.expectOnLoginPage();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();

    // Back button must not restore the authenticated dashboard.
    await page.goBack();
    await loginPage.expectOnLoginPage();

    await page.goto('/admin/customers');
    await loginPage.expectOnLoginPage();
  });
});

test.describe('TC13 unauthenticated users cannot access protected routes', () => {
  for (const route of [DASHBOARD_PATH, '/admin/analytics', '/admin/customers', '/admin/order-tracker']) {
    test(`redirects ${route} to login`, async ({ page, loginPage, dashboardPage }) => {
      await page.goto(route);
      await loginPage.expectOnLoginPage();
      await expect(dashboardPage.dashboardLink).toBeHidden();
    });
  }
});

test.describe('TC15 console errors and failed network requests', () => {
  test('login page loads without console errors or failed requests', async ({ page, loginPage, pageErrors }) => {
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    expect(pageErrors.console).toEqual([]);
    expect(pageErrors.failedRequests).toEqual([]);
  });

  test('invalid login produces only the expected 400 from the login API', async ({ page, loginPage, pageErrors }) => {
    await loginPage.goto();
    await loginPage.login(unregisteredUsername(), 'WrongPass#123');
    await expect(loginPage.fieldError('password')).toBeVisible();
    await page.waitForLoadState('networkidle');

    expect(pageErrors.failedRequests).toHaveLength(1);
    expect(pageErrors.failedRequests[0]).toMatch(new RegExp(`^400 POST .*${LOGIN_API}$`));
    // Only the browser's own "Failed to load resource" log for that 400; no JS exceptions.
    for (const msg of pageErrors.console) expect(msg).toMatch(/Failed to load resource: .* 400/);
  });

  test('valid login and dashboard landing have no console errors or failed requests', async ({ page, loginPage, dashboardPage, credentials, pageErrors }) => {
    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);
    await dashboardPage.expectLoaded();
    await page.waitForLoadState('networkidle');
    expect.soft(pageErrors.console, 'console errors after login').toEqual([]);
    expect(pageErrors.failedRequests, 'failed requests after login').toEqual([]);
  });
});
