const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const URL = process.env.URL || 'https://tharwah.qa/login';
const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

test.setTimeout(120000);

test('Add Recyclables Category and Verify', async ({ page }) => {
  const uniqueId = Date.now();
  const categoryName = `motor_${uniqueId}`;
  const categoryNameAr = `motor_ar_${uniqueId}`;

  // 1) Navigate to the login page
  await page.goto(URL);

  // 2) Login
  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();

  // 3) Navigate to Recyclables Category
  await page.getByRole('button', { name: 'Recyclables Settings' }).click();
  await page.getByRole('link', { name: 'Recyclables Category' }).click();
  await expect(page).toHaveURL(/.*recyclables-category/);

  // 4) Click Add Category
  await page.getByRole('button', { name: 'Add Category' }).click();

  // 5) Fill the form
  console.log(`Filling category names with ${categoryName}...`);
  await page.getByRole('textbox', { name: 'Category Name (English)' }).fill(categoryName);
  await page.getByRole('textbox', { name: 'Category Name (Arabic)' }).fill(categoryNameAr);
  
  // Is Payable
  console.log('Selecting Is Payable...');
  await page.getByRole('combobox', { name: /Is Payable/ }).click();
  await page.getByRole('option', { name: 'Yes' }).click();

  // 6) Upload Category Image
  console.log('Uploading category image...');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Category Image' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.resolve(__dirname, 'motor_category.jpeg'));
  await page.waitForTimeout(2000); // Give it a moment to process the upload

  // 7) Click Create
  console.log('Clicking Create...');
  await page.getByRole('button', { name: 'Create' }).click();

  // 8) Verify the category appears in the list
  console.log('Verifying category creation...');
  // Wait for the dialog to disappear
  await expect(page.getByRole('heading', { name: 'Add Category' })).not.toBeVisible({ timeout: 10000 });

  await page.getByPlaceholder('Search category').fill(categoryName);
  await page.waitForTimeout(3000);

  // Take a screenshot of the grid for diagnostic purposes
  await page.screenshot({ path: 'recyclables_category_verification.png' });

  // Try to find the category in the grid
  console.log(`Checking for gridcell with text "${categoryName}"...`);
  const categoryNameCell = page.getByRole('gridcell').filter({ hasText: categoryName }).first();
  
  try {
    await expect(categoryNameCell).toBeVisible({ timeout: 15000 });
  } catch (e) {
    console.error(`Category "${categoryName}" not visible after creation.`);
    // List all visible text in cells to see what we DID find
    const allCells = await page.getByRole('gridcell').allInnerTexts();
    console.log('Current grid cell contents:', allCells);
    throw e;
  }
  
  const row = page.getByRole('row', { name: new RegExp(categoryName, 'i') }).first();
  await expect(row).toContainText('Yes');
});
