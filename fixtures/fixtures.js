// @ts-check
import { test as base, expect } from '@playwright/test';
import { LoginPage, LOGIN_PATH } from '../pages/LoginPage.js';
import { DashboardPage, DASHBOARD_PATH } from '../pages/DashboardPage.js';
import { CustomersPage } from '../pages/CustomersPage.js';

export const test = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  customersPage: async ({ page }, use) => {
    await use(new CustomersPage(page));
  },

  // Logs in once per worker and shares the session (localStorage tokens) with every test that
  // opts in via `test.use({ storageState: ... })`. Only instantiated when requested, so the
  // login tests are unaffected.
  authStorageState: [async ({ browser }, use, workerInfo) => {
    const { LOGIN_USERNAME: username, LOGIN_PASSWORD: password } = process.env;
    if (!username || !password) {
      await use(undefined); // tests are skipped by the `credentials` fixture
      return;
    }
    const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    // Cold browser + first download of the app bundle: allow longer than the default 5s (WebKit was seen exceeding it).
    await page.goto(LOGIN_PATH);
    await expect(loginPage.heading).toBeVisible({ timeout: 30_000 });
    const response = await loginPage.login(username, password);
    expect(response.status(), 'shared session login').toBe(200);
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_PATH}/?$`));
    // Authenticated shell rendered => tokens are stored. Generous timeouts: this runs once per
    // worker while other workers load the live server (Firefox was observed taking >5s here).
    await expect(new DashboardPage(page).dashboardLink).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token')),
      { message: 'access_token stored after login', timeout: 15_000 }).not.toBeNull();
    const state = await context.storageState();
    await context.close();
    await use(state);
  }, { scope: 'worker', timeout: 60_000 }],

  // Credentials come only from the environment; tests needing them are skipped if absent.
  credentials: async ({}, use, testInfo) => {
    const { LOGIN_USERNAME: username, LOGIN_PASSWORD: password } = process.env;
    testInfo.skip(!username || !password, 'LOGIN_USERNAME / LOGIN_PASSWORD not set in .env');
    await use({ username: /** @type {string} */ (username), password: /** @type {string} */ (password) });
  },

  // Collects console errors, uncaught page errors, failed requests and HTTP >= 400 responses.
  pageErrors: async ({ page }, use) => {
    const errors = { console: /** @type {string[]} */ ([]), failedRequests: /** @type {string[]} */ ([]) };
    page.on('console', msg => { if (msg.type() === 'error') errors.console.push(msg.text()); });
    page.on('pageerror', err => errors.console.push(`pageerror: ${err.message}`));
    page.on('requestfailed', req => errors.failedRequests.push(`${req.method()} ${req.url()} (${req.failure()?.errorText})`));
    page.on('response', res => { if (res.status() >= 400) errors.failedRequests.push(`${res.status()} ${res.request().method()} ${res.url()}`); });
    await use(errors);
  },
});

export { expect };
