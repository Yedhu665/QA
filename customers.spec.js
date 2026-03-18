const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env in the current folder
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const URL = process.env.URL;
const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

if (!URL || !USERNAME || !PASSWORD) {
  throw new Error('Missing required environment variables. Make sure .env defines URL, USERNAME, and PASSWORD.');
}

test('Navigate to Customer List, Search, Edit and Verify Update', async ({ page }) => {
  test.setTimeout(60000);
  console.log('Starting test...');
  // 1) Navigate to the URL from the .env file
  await page.goto(URL);
  console.log('Navigated to URL');

  // 2) Login using credentials from .env
  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();

  // Wait for the login to complete
  try {
    await page.waitForURL(u => u.href === URL || u.href === URL.replace(/\/$/, ''), { timeout: 15000 });
  } catch (e) {
    await page.screenshot({ path: 'login-failure.png' });
    throw new Error('Login failed or timed out. Screenshot saved as login-failure.png. Error: ' + e.message);
  }
  
  // 3) Navigate directly to the Customer List page
  // Ensuring URL is clean (handles potential double slashes)
  const customersUrl = URL.endsWith('/') ? URL + 'customers' : URL + '/customers';
  await page.goto(customersUrl);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/.*customers/);

  // 4) In the search field labeled "Search customer", type "test"
  const searchBox = page.getByPlaceholder('Search customer');
  await searchBox.fill('test');
  
  // Wait for the list to filter
  await page.waitForTimeout(2000);

  // 5) Verify that a row appears where the Full Name is "Test"
  // Note: Searching for "Test" (case-insensitive or exact as seen in UI)
  const testRow = page.getByRole('row', { name: /Test/i }).first();
  await expect(testRow).toBeVisible();

  // 6) In that row, locate the three-dot menu (⋯) on the right side and click it
  // Identified as a "more" button in the row
  const moreButton = testRow.getByRole('button', { name: 'more' });
  await moreButton.click();

  // 7) Select the Edit option from the dropdown
  await page.getByRole('menuitem', { name: 'Edit' }).click();

  // 8) In the edit form:
  // - Change Full Name from Test to Vijay
  await page.getByRole('textbox', { name: 'Full Name' }).fill('Vijay');
  
  // - Ensure the country code is numeric only (no +)
  await page.getByRole('textbox', { name: 'customers.countryCode' }).fill('91');

  // - Change the Phone Number to a new number (must be 8 digits as per validation)
  const newPhone = '87654321';
  await page.getByRole('textbox', { name: 'Phone Number' }).fill(newPhone);

  // 9) Click the Save / Update button
  await page.getByRole('button', { name: 'Update' }).click();
  
  // Wait for the modal/form to disappear or the page to settle
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');

  // 10) Verify that the customer list updates and the Full Name is now "Vijay"
  // Re-locate search box in case of page reload/navigation
  const searchBoxAfter = page.getByPlaceholder('Search customer');
  const updatedName = 'Vijay';
  
  await searchBoxAfter.clear();
  await searchBoxAfter.fill(updatedName);
  await page.waitForTimeout(2000);

  const updatedRow = page.getByRole('row', { name: new RegExp(updatedName, 'i') }).first();
  await expect(updatedRow).toBeVisible({ timeout: 15000 });

  // 11) Verify that the Phone Number is updated correctly
  await expect(updatedRow).toContainText(newPhone);

  // 12) Ensure the Status remains Active after the update
  await expect(updatedRow).toContainText('Active');
});
