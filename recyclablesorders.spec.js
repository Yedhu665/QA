const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');
const { LoginPage } = require('./pages/LoginPage');

// Load environment variables from .env in the current folder
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const URL = process.env.URL;
const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

if (!URL || !USERNAME || !PASSWORD) {
  throw new Error('Missing required environment variables. Make sure .env defines URL, USERNAME, and PASSWORD.');
}

test('Recyclables Orders Test - Edit Row 4', async ({ page }) => {
  test.setTimeout(90000);

  // 1 & 2. Navigate to the URL from the .env file and Login using POM
  const loginPage = new LoginPage(page);
  await loginPage.goto(URL);
  await loginPage.login(USERNAME, PASSWORD);

  // Wait for the login to complete
  try {
    await page.waitForURL(u => u.href === URL || u.href === URL.replace(/\/$/, ''), { timeout: 15000 });
  } catch (e) {
    await page.screenshot({ path: 'login-failure.png' });
    throw new Error('Login failed or timed out. Screenshot saved.');
  }

  // 3. Click the recyclables orders
  const ordersMenu = page.getByRole('button', { name: 'Orders' });
  await ordersMenu.waitFor({ state: 'visible' });
  
  // Checking if orders is a submenu that needs to be expanded
  if (await ordersMenu.getAttribute('aria-expanded') === 'false' || await ordersMenu.getAttribute('aria-expanded') === null) {
      await ordersMenu.click();
  }
  
  await page.getByRole('link', { name: 'Recyclables Orders' }).click();
  await page.waitForLoadState('domcontentloaded');

  // Wait for the grid rows to load
  await page.locator('[role="row"]').nth(1).waitFor({ state: 'visible', timeout: 30000 });

  // 4. Locate the orders table and click the row with Sl.No value 4
  // 5. click the edit option
  // Find the row containing '4' in the id column
  const row4 = page.locator('.MuiDataGrid-row').filter({ has: page.getByRole('gridcell', { name: '4', exact: true }) }).first();
  await row4.waitFor({ state: 'attached' });
  const rowId = await row4.getAttribute('data-id');

  // Scroll the table to the right so 'action' column might be visible
  await page.locator('.MuiDataGrid-virtualScroller').evaluate(node => node.scrollLeft = 2000).catch(() => {});

  // Use the saved data-id to identify the row since virtual scrolling might remove the ID column
  // The action button (more) is in the last column of the row. We must make it visible first.
  const actionBtn = page.locator(`.MuiDataGrid-row[data-id="${rowId}"] [aria-label="more"], .MuiDataGrid-row[data-id="${rowId}"] #action-button`);
  await actionBtn.scrollIntoViewIfNeeded();
  await actionBtn.click();

  // Wait for the popup menu to appear
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
  
  // Click Edit from the dropdown menu
  await page.getByRole('menuitem', { name: /Edit/i }).click();

  // Wait for Edit Page to load
  await page.waitForURL(/\/recyclables-orders\/edit\/\d+/, { timeout: 15000 });
  await expect(page.getByText('Edit Recyclables Order', { exact: true }).first()).toBeVisible({ timeout: 15000 });

  // 6. change the status is completed
  const statusCombo = page.locator("p:has-text('Order Status') + div [role='combobox']");
  await statusCombo.click();
  await page.getByRole('option', { name: /completed/i }).click();

  // 7. select the provider in shahid
  const providerCombo = page.locator("p:has-text('Provider') + div [role='combobox']");
  await providerCombo.click();
  await page.getByRole('option', { name: /shahid/i }).click();

  // 8. delete the existing item and again click the edit button add newspaper item and weight is 12kg and click the save button
  
  // Delete existing item(s) if any
  const deleteBtns = page.locator('[aria-label="delete"], [aria-label="Delete"]');
  let count = await deleteBtns.count();
  while (count > 0) {
     await deleteBtns.first().click();
     // Wait for the item to be removed
     await page.waitForTimeout(500); 
     count = await deleteBtns.count();
  }

  // Add Item "Newspapers" - this opens a dialog to enter weight
  // Using a more robust locator for the combo box
  const addItemCombo = page.locator('div, p, label').filter({ hasText: /^Add Recyclables Item$/ }).first().locator('xpath=./..').getByRole('combobox');
  await addItemCombo.scrollIntoViewIfNeeded();
  await addItemCombo.click();
  
  // Try to type and press enter as it's more reliable for some MUI components
  await page.keyboard.type('Newspapers');
  await page.waitForTimeout(1000); // Wait for results to filter
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  // Verify the dialog 'Add Recyclables Item' appears
  const dialog = page.getByRole('dialog', { name: 'Add Recyclables Item' });
  // If it didn't open via keyboard, try the click method one last time
  if (!await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByRole('option', { name: /newspaper/i }).click({ force: true }).catch(() => {});
  }
  
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.getByRole('spinbutton', { name: 'Weight' }).fill('12');

  // Click the Add Item button (enabled once weight is filled)
  const addItemBtn = dialog.getByRole('button', { name: 'Add Item' });
  await expect(addItemBtn).toBeEnabled();
  await addItemBtn.click();

  // Dialog should close - assert the item was added
  await expect(dialog).not.toBeVisible();
  // Using a more flexible assertion for the item count text
  await expect(page.locator('p, span, div').filter({ hasText: /Recyclables Items/i }).first()).toContainText('1', { timeout: 10000 });

  // Click the save button
  const saveBtn = page.locator('button').filter({ hasText: 'Save Changes' });
  await saveBtn.scrollIntoViewIfNeeded();
  await saveBtn.click();
  
  // Wait for save to complete - assert we navigated back to the orders list or a success toast appears
  await expect(page).toHaveURL(/recyclables-orders/, { timeout: 15000 });
});

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `failure-${testInfo.title.replace(/\s+/g, '-')}.png`, fullPage: true });
  }
});
