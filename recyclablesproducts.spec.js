const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

const { LoginPage } = require('./pages/LoginPage');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const URL = process.env.URL || 'https://tharwah.qa/login';
const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

test.setTimeout(120000);

test.describe('Recyclables Product - Add Product Modal', () => {

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto(URL);
        await loginPage.login(USERNAME, PASSWORD);

        // Navigate to Recyclables Product
        await page.getByRole('button', { name: 'Recyclables Settings' }).click();
        await page.getByRole('link', { name: 'Recyclables Product' }).click();
        await expect(page).toHaveURL(/.*recyclables-product/);
    });

    test('Validate mandatory fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Product' }).click();
        await page.waitForTimeout(1000); // Give modal time to stabilize

        // Click Create without filling anything
        await page.getByRole('button', { name: 'Create' }).click();

        // Fields that show errors immediately based on my observation
        const validations = [
            'Product name (English) is required',
            'Product name (Arabic) is required',
            'Category is required'
        ];

        for (const errorText of validations) {
            await expect(page.getByText(errorText)).toBeVisible();
        }

        // Other fields like Rate and CO2 Factor might be empty but not showing errors yet
        await expect(page.getByRole('textbox', { name: /Rate/i })).toHaveValue('');
        await expect(page.getByRole('textbox', { name: /CO2 Factor/i })).toHaveValue('');
    });

    test('Positive Testing - Add New Product with Image', async ({ page }) => {
        const uniqueId = Date.now();
        const productNameEn = `Recycle_${uniqueId}`;
        const productNameAr = `إعادة تدوير_${uniqueId}`;

        await page.getByRole('button', { name: 'Add Product' }).click();

        await page.getByRole('textbox', { name: 'Product Name (English)' }).fill(productNameEn);
        await page.getByRole('textbox', { name: 'Product Name (Arabic)' }).fill(productNameAr);

        // Select Category
        await page.getByRole('combobox', { name: /Category Name/ }).click();
        await page.getByRole('option').first().click();

        await page.getByRole('textbox', { name: 'Rate' }).fill('10');

        // Select Unit
        await page.getByRole('combobox', { name: /Unit/ }).click();
        await page.getByRole('option').first().click();

        await page.getByRole('textbox', { name: 'CO2 Factor' }).fill('0.5');
        await page.getByRole('textbox', { name: 'Product Description' }).fill('Verification test product description');

        // Upload Image
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Product Image' }).click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(path.resolve(__dirname, 'motor_category.jpeg')); // Using existing image

        await page.getByRole('button', { name: 'Create' }).click();

        // Verification
        await expect(page.getByRole('heading', { name: 'Add Product' })).not.toBeVisible({ timeout: 15000 });

        await page.getByPlaceholder('Search product').fill(productNameEn);
        await page.waitForTimeout(2000);

        const productRow = page.getByRole('row', { name: new RegExp(productNameEn, 'i') }).first();
        await expect(productRow).toBeVisible();
        await expect(productRow).toContainText('10');
    });

    test('Boundary and Negative Testing', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Product' }).click();

        // Boundary: Zero Rate
        await page.getByRole('textbox', { name: 'Rate' }).fill('0');
        // Depending on business rules, zero might be valid or invalid.

        // Negative: Non-numeric in CO2 Factor
        await page.getByRole('textbox', { name: 'CO2 Factor' }).fill('abc');
        await expect(page.getByRole('textbox', { name: 'CO2 Factor' })).toHaveValue(''); // If it enforces numeric only

        // Boundary: Long name
        const longName = 'A'.repeat(101);
        await page.getByRole('textbox', { name: 'Product Name (English)' }).fill(longName);
        const val = await page.getByRole('textbox', { name: 'Product Name (English)' }).inputValue();
        // Verify if truncation or error occurs (example: checking if length is capped or error shown)
        if (val.length <= 100) {
            console.log('Input truncated to 100 characters');
        }

        await page.getByRole('button', { name: 'Cancel' }).click();
    });

    test('Multilingual Input Validation', async ({ page }) => {
        await page.getByRole('button', { name: 'Add Product' }).click();

        const arabicName = 'منتج تجريبي';
        const englishName = 'Trial Product';

        await page.getByRole('textbox', { name: 'Product Name (English)' }).fill(englishName);
        await page.getByRole('textbox', { name: 'Product Name (Arabic)' }).fill(arabicName);

        await expect(page.getByRole('textbox', { name: 'Product Name (Arabic)' })).toHaveValue(arabicName);
        await expect(page.getByRole('textbox', { name: 'Product Name (English)' })).toHaveValue(englishName);

        await page.getByRole('button', { name: 'Cancel' }).click();
    });
});
