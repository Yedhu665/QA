// @ts-check
import { test, expect } from '../fixtures/fixtures.js';
import { CUSTOMERS_PATH, CUSTOMER_COLUMNS, FIELD } from '../pages/CustomersPage.js';

// The grid virtualises columns: at narrower widths "Pending Point Requests" and "Created At"
// are not in the DOM until scrolled. A wide viewport renders all columns without scrolling.
test.use({
  viewport: { width: 1920, height: 1080 },
  // Reuse one login per worker instead of logging in (and loading the dashboard) for every test.
  storageState: async ({ authStorageState }, use) => use(authStorageState),
});

const PAGE_SIZE = 10;
const PHONE_RE = /^\+\d{1,4} \d{6,12}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATFORM_RE = /^(android|ios)$/i;
const LANGUAGES = ['English', 'Arabic'];
const STATUSES = ['Active', 'Inactive'];
const NON_NEGATIVE_NUMBER_RE = /^\d+(\.\d+)?$/;
const DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/; // M/D/YYYY, as rendered by the app

/** @param {string} text M/D/YYYY */
const parseDisplayDate = text => {
  const [, m, d, y] = /** @type {RegExpMatchArray} */ (text.match(DATE_RE));
  return new Date(Number(y), Number(m) - 1, Number(d));
};

test.describe('Customers - listing page', () => {
  /** @type {{ status: number, body: { count: number, results: any[] } }} */
  let api;

  // `credentials` skips the suite when .env has no login; the session itself comes from authStorageState.
  test.beforeEach(async ({ customersPage, credentials }) => {
    api = await customersPage.goto();
  });

  test('TC01 Customers page loads successfully', async ({ page, customersPage }) => {
    expect(api.status).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${CUSTOMERS_PATH}/?$`));
    await expect(page).toHaveTitle('Tharwah - Customers');
    await expect(customersPage.heading).toBeVisible();
    await expect(customersPage.grid).toBeVisible();
  });

  test('TC02 all table column headers are displayed in order', async ({ customersPage }) => {
    for (const name of CUSTOMER_COLUMNS) {
      await expect(customersPage.columnHeader(name), `column "${name}"`).toBeVisible();
    }
    expect(await customersPage.headerTexts()).toEqual(CUSTOMER_COLUMNS);
  });

  test('TC03 customer records are displayed', async ({ customersPage }) => {
    expect(api.body.count).toBeGreaterThan(0);
    const expectedRows = Math.min(PAGE_SIZE, api.body.count);
    await expect(customersPage.rows).toHaveCount(expectedRows);
    await expect(customersPage.rows.first()).toBeVisible();

    // SI No is a running sequence starting at 1.
    const siNos = await customersPage.columnValues(FIELD.siNo);
    expect(siNos).toEqual(Array.from({ length: expectedRows }, (_, i) => String(i + 1)));
  });

  test('TC04 Full Name, Phone Number and Email are populated and well-formed', async ({ customersPage }) => {
    const names = await customersPage.columnValues(FIELD.fullName);
    const phones = await customersPage.columnValues(FIELD.phone);
    const emails = await customersPage.columnValues(FIELD.email);

    expect(names.length).toBeGreaterThan(0);
    names.forEach((name, i) => expect(name, `row ${i + 1} full name`).not.toBe(''));
    phones.forEach((phone, i) => expect(phone, `row ${i + 1} phone`).toMatch(PHONE_RE));
    emails.forEach((email, i) => expect(email, `row ${i + 1} email`).toMatch(EMAIL_RE));
  });

  test('TC05 Platform is Android or iOS', async ({ customersPage }) => {
    const platforms = await customersPage.columnValues(FIELD.platform);
    expect(platforms.length).toBeGreaterThan(0);
    platforms.forEach((p, i) => expect(p, `row ${i + 1} platform`).toMatch(PLATFORM_RE));
  });

  test('TC06 Language and Status show valid values', async ({ customersPage }) => {
    const languages = await customersPage.columnValues(FIELD.language);
    const statuses = await customersPage.columnValues(FIELD.status);
    expect(languages.length).toBeGreaterThan(0);
    languages.forEach((l, i) => expect(LANGUAGES, `row ${i + 1} language "${l}"`).toContain(l));
    statuses.forEach((s, i) => expect(STATUSES, `row ${i + 1} status "${s}"`).toContain(s));
  });

  test('TC07 Point Balance is a non-negative number', async ({ customersPage }) => {
    const points = await customersPage.columnValues(FIELD.points);
    expect(points.length).toBeGreaterThan(0);
    points.forEach((p, i) => expect(p, `row ${i + 1} point balance`).toMatch(NON_NEGATIVE_NUMBER_RE));
  });

  test('TC08 Pending Point Requests is a non-negative number', async ({ customersPage }) => {
    const pending = await customersPage.columnValues(FIELD.pendingPoints);
    expect(pending.length).toBeGreaterThan(0);
    pending.forEach((p, i) => expect(p, `row ${i + 1} pending point requests`).toMatch(NON_NEGATIVE_NUMBER_RE));
  });

  test('TC09 Created At is a valid past date, newest first', async ({ customersPage }) => {
    const dates = await customersPage.columnValues(FIELD.createdAt);
    expect(dates.length).toBeGreaterThan(0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const parsed = dates.map((text, i) => {
      expect(text, `row ${i + 1} created at`).toMatch(DATE_RE);
      const date = parseDisplayDate(text);
      expect(Number.isNaN(date.getTime()), `row ${i + 1} "${text}" is a real date`).toBe(false);
      expect(date.getTime(), `row ${i + 1} "${text}" is not in the future`).toBeLessThanOrEqual(endOfToday.getTime());
      return date.getTime();
    });

    const sortedDesc = [...parsed].sort((a, b) => b - a);
    expect(parsed, 'rows are ordered newest first').toEqual(sortedDesc);
  });

  test('TC10 table data matches the customers API', async ({ customersPage }) => {
    const expected = api.body.results;
    await expect(customersPage.rows).toHaveCount(expected.length);

    // Footer total matches the API count.
    await expect(customersPage.paginationSummary).toContainText(`out of ${api.body.count}`);

    // Each row id is unique and in API order.
    const ids = await customersPage.rows.evaluateAll(rows => rows.map(r => r.getAttribute('data-id')));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expected.map(c => String(c.id)));

    for (const [i, customer] of expected.entries()) {
      const row = customersPage.rows.nth(i);
      const label = `row ${i + 1} (id ${customer.id})`;
      const cell = (/** @type {string} */ field) => customersPage.cell(row, field);

      await expect.soft(cell(FIELD.fullName), `${label} full name`).toHaveText(customer.full_name);
      await expect.soft(cell(FIELD.phone), `${label} phone`).toHaveText(`${customer.country_code} ${customer.phone_number}`);
      await expect.soft(cell(FIELD.email), `${label} email`).toHaveText(customer.email);
      await expect.soft(cell(FIELD.platform), `${label} platform`).toHaveText(customer.platform);
      await expect.soft(cell(FIELD.language), `${label} language`).toHaveText(customer.is_arabic ? 'Arabic' : 'English');
      await expect.soft(cell(FIELD.status), `${label} status`).toHaveText(customer.is_active ? 'Active' : 'Inactive');
      await expect.soft(cell(FIELD.points), `${label} point balance`).toHaveText(String(customer.point));
      await expect.soft(cell(FIELD.pendingPoints), `${label} pending points`).toHaveText(String(customer.pending_points));
      // Browser and test runner share the machine timezone, so en-US locale formatting matches the UI.
      await expect.soft(cell(FIELD.createdAt), `${label} created at`)
        .toHaveText(new Date(customer.created_at).toLocaleDateString('en-US'));
    }
  });
});
