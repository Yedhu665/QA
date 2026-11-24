// @ts-check
// Ported from QA master: customers.spec.js (edit flow). Edits a real customer record.
import { authTest as test, expect, DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON } from '../fixtures/fixtures.js';

test.use({ viewport: { width: 1920, height: 1080 } }); // action column is virtualised off-screen at narrower widths

test.describe('Customers - edit customer', () => {
  test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);

  test('search, edit name and phone, verify the update', async ({ page, customersPage }) => {
    test.setTimeout(60_000);
    const updatedName = 'Vijay';
    const newPhone = '87654321'; // 8 digits, as per validation

    await customersPage.goto();
    await customersPage.searchInput.fill('test');
    const testRow = page.getByRole('row', { name: /Test/i }).first();
    await expect(testRow).toBeVisible();

    await testRow.getByRole('button', { name: 'more' }).click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    await page.getByRole('textbox', { name: 'Full Name' }).fill(updatedName);
    await page.getByRole('textbox', { name: 'customers.countryCode' }).fill('91'); // numeric only, no "+"
    await page.getByRole('textbox', { name: 'Phone Number' }).fill(newPhone);
    await page.getByRole('button', { name: 'Update' }).click();
    await expect(page.getByRole('button', { name: 'Update' })).toBeHidden({ timeout: 15_000 });

    await customersPage.searchInput.clear();
    await customersPage.searchInput.fill(updatedName);
    const updatedRow = page.getByRole('row', { name: new RegExp(updatedName, 'i') }).first();
    await expect(updatedRow).toBeVisible({ timeout: 15_000 });
    await expect(updatedRow).toContainText(newPhone);
    await expect(updatedRow).toContainText('Active');
  });
});
