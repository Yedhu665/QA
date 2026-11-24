// @ts-check
import { expect } from '@playwright/test';

/** Path of the login page, derived from BASE_URL (e.g. /admin/login). */
export const LOGIN_PATH = process.env.BASE_URL ? new URL(process.env.BASE_URL).pathname : '/admin/login';

/** API endpoint the login form posts to (observed on the live app). */
export const LOGIN_API = '/dashboard/auth/login/';

export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Log in' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    // type=password inputs have no implicit ARIA role, so use the associated label.
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    // Show/hide password icon button — it has no accessible name, so scope it to the form.
    this.passwordToggle = page.locator('form').getByRole('button').filter({ hasNotText: 'Log in' });
  }

  async goto() {
    const response = await this.page.goto(LOGIN_PATH);
    await expect(this.heading).toBeVisible();
    return response;
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async fill(username, password) {
    if (username) await this.usernameInput.fill(username);
    if (password) await this.passwordInput.fill(password);
  }

  /** Clicks "Log in" and returns the login API response. */
  async submit() {
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes(LOGIN_API) && r.request().method() === 'POST'),
      this.loginButton.click(),
    ]);
    return response;
  }

  /**
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    await this.fill(username, password);
    return this.submit();
  }

  /** Inline helper text shown under a field (linked via aria-describedby). */
  fieldError(/** @type {'username' | 'password'} */ field) {
    return this.page.locator(`#${field}-helper-text`);
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(new RegExp(`${LOGIN_PATH}$`));
    await expect(this.loginButton).toBeVisible();
  }
}
