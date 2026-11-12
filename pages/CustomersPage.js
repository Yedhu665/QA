// @ts-check
import { expect } from '@playwright/test';

/** Route of the Customers listing page. */
export const CUSTOMERS_PATH = '/admin/customers';

/** API endpoint that feeds the customers grid (observed on the live app). */
export const CUSTOMERS_API = '/dashboard/customers/';

/** Visible column headers, in display order (the trailing action column has no header text). */
export const CUSTOMER_COLUMNS = [
  'SI No',
  'Full Name',
  'Phone Number',
  'Email',
  'Platform',
  'Language',
  'Status',
  'Point Balance',
  'Pending Point Requests',
  'Created At',
];

/** MUI DataGrid `data-field` values for each data column. */
export const FIELD = {
  siNo: 'id',
  fullName: 'full_name',
  phone: 'phone_number',
  email: 'email',
  platform: 'platform',
  language: 'is_arabic',
  status: 'is_active',
  points: 'point',
  pendingPoints: 'pending_points',
  createdAt: 'created_at',
};

export class CustomersPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Customers', level: 4 });
    this.grid = page.getByRole('grid');
    this.columnHeaders = this.grid.getByRole('columnheader');
    // Data rows carry the record id in data-id; the header row does not.
    this.rows = this.grid.locator('[role="row"][data-id]');
    // Footer text, e.g. "Showing 1-10 out of 333 items".
    this.paginationSummary = page.getByText(/\d+-\d+ out of \d+/);
  }

  /**
   * Opens the Customers page and returns the parsed customers API response.
   * @returns {Promise<{ status: number, body: { count: number, results: any[] } }>}
   */
  async goto() {
    const [response] = await Promise.all([
      // Exact pathname match: /dashboard/customers/platforms/ is also requested on load.
      this.page.waitForResponse(r =>
        new URL(r.url()).pathname === CUSTOMERS_API && r.request().method() === 'GET' && r.ok()),
      this.page.goto(CUSTOMERS_PATH),
    ]);
    await this.expectLoaded();
    return { status: response.status(), body: await response.json() };
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${CUSTOMERS_PATH}/?$`));
    await expect(this.heading).toBeVisible();
    await expect(this.grid).toBeVisible();
    await expect(this.rows.first()).toBeVisible();
  }

  /** @param {string} name */
  columnHeader(name) {
    return this.grid.getByRole('columnheader', { name, exact: true });
  }

  /**
   * @param {import('@playwright/test').Locator} row
   * @param {string} field one of FIELD values
   */
  cell(row, field) {
    return row.locator(`[role="gridcell"][data-field="${field}"]`);
  }

  /**
   * Trimmed text of one column for every rendered row.
   * @param {string} field one of FIELD values
   */
  async columnValues(field) {
    return (await this.grid.locator(`[role="row"][data-id] [role="gridcell"][data-field="${field}"]`).allInnerTexts())
      .map(t => t.trim());
  }

  /** Header texts in display order, excluding the empty action column. */
  async headerTexts() {
    return (await this.columnHeaders.allInnerTexts()).map(t => t.trim()).filter(Boolean);
  }
}
