// @ts-check
// Ported from QA master: recyclablesorders.spec.js. Edits a real order (status, provider, items).
import { authTest as test, expect, DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON } from '../fixtures/fixtures.js';

const RECYCLABLES_ORDERS_PATH = '/admin/recyclables-orders';

test.use({ viewport: { width: 1920, height: 1080 } });

test.describe('Recyclables Orders - edit order', () => {
  test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);

  test('edit row 4: complete, assign provider, replace items with 12 kg newspapers', async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto(RECYCLABLES_ORDERS_PATH);
    await expect(page.getByRole('heading', { name: 'Recyclables Orders', level: 4 })).toBeVisible();

    // Row whose SI No cell is exactly "4". Keep its data-id: column virtualisation can drop the SI No cell.
    const row4 = page.locator('.MuiDataGrid-row').filter({ has: page.getByRole('gridcell', { name: '4', exact: true }) }).first();
    await expect(row4).toBeVisible({ timeout: 30_000 });
    const rowId = await row4.getAttribute('data-id');

    await page.locator('.MuiDataGrid-virtualScroller').evaluate(node => { node.scrollLeft = node.scrollWidth; });
    const actionButton = page.locator(`.MuiDataGrid-row[data-id="${rowId}"]`).getByRole('button', { name: 'more' });
    await actionButton.click();
    await page.getByRole('menuitem', { name: /Edit/i }).click();

    await expect(page).toHaveURL(/\/recyclables-orders\/edit\/\d+/, { timeout: 15_000 });
    await expect(page.getByText('Edit Recyclables Order', { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    await page.locator("p:has-text('Order Status') + div [role='combobox']").click();
    await page.getByRole('option', { name: /completed/i }).click();

    await page.locator("p:has-text('Provider') + div [role='combobox']").click();
    await page.getByRole('option', { name: /shahid/i }).click();

    // Remove existing items one by one; the count assertion waits for each removal.
    const deleteButtons = page.locator('[aria-label="delete"], [aria-label="Delete"]');
    for (let remaining = await deleteButtons.count(); remaining > 0; remaining--) {
      await deleteButtons.first().click();
      await expect(deleteButtons).toHaveCount(remaining - 1);
    }

    const addItemCombo = page.locator('div, p, label').filter({ hasText: /^Add Recyclables Item$/ }).first()
      .locator('xpath=./..').getByRole('combobox');
    await addItemCombo.click();
    await page.keyboard.type('Newspapers');
    await page.getByRole('option', { name: /newspaper/i }).first().click();

    const dialog = page.getByRole('dialog', { name: 'Add Recyclables Item' });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('spinbutton', { name: 'Weight' }).fill('12');
    const addItemButton = dialog.getByRole('button', { name: 'Add Item' });
    await expect(addItemButton).toBeEnabled();
    await addItemButton.click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('p, span, div').filter({ hasText: /Recyclables Items/i }).first()).toContainText('1', { timeout: 10_000 });

    await page.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page).toHaveURL(/recyclables-orders/, { timeout: 15_000 });
  });
});
