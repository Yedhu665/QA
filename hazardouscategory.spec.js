const { test, expect } = require('@playwright/test');
const { HazardousCategoryPage } = require('./pages/HazardousCategoryPage');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

test.describe('Hazardous Category - Add Category Modal', () => {
    let categoryPage;

    test.beforeEach(async ({ page }) => {
        categoryPage = new HazardousCategoryPage(page);
        // Storage state handles login automatically via playwright.config.js
        await page.goto(process.env.URL || 'https://tharwah.qa/');
        await categoryPage.goto();
    });

    test('Validate mandatory fields', async () => {
        await categoryPage.openAddCategoryModal();
        await categoryPage.submit();

        // Assuming standard error messages as seen in Recyclables
        await categoryPage.expectErrorMessage('Category Name (English)', 'English name is required');
        await categoryPage.expectErrorMessage('Category Name (Arabic)', 'Arabic name is required');
    });

    test('Positive Testing - Add New Hazardous Category with Image', async () => {
        const uniqueId = Date.now();
        const categoryName = `Haz_Test_${uniqueId}`;
        const categoryNameAr = `خطر_اختبار_${uniqueId}`;

        await categoryPage.openAddCategoryModal();
        await categoryPage.fillCategoryDetails({
            englishName: categoryName,
            arabicName: categoryNameAr,
            status: 'Inactive'
        });

        // File upload
        const filePath = path.resolve(__dirname, 'assets/test-image.png');
        await categoryPage.uploadImage(filePath);

        await categoryPage.submit();

        // Verify creation
        await categoryPage.verifyCategoryInGrid(categoryName, 'Inactive');
    });

    test('Boundary Testing - Long Name', async () => {
        const longName = 'H'.repeat(101); // Testing edge case for character limit

        await categoryPage.openAddCategoryModal();
        await categoryPage.fillCategoryDetails({
            englishName: longName,
            arabicName: 'اختبار'
        });

        await categoryPage.submit();
        // Verification depends on application behavior (e.g., error message or truncation)
    });

    test('Multilingual Input Validation', async () => {
        const categoryName = `Haz_Multilang_${Date.now()}`;
        const categoryNameAr = `تصنيف_خطير_${Date.now()}`;

        await categoryPage.openAddCategoryModal();
        await categoryPage.fillCategoryDetails({
            englishName: categoryName,
            arabicName: categoryNameAr
        });

        await categoryPage.submit();
        await categoryPage.verifyCategoryInGrid(categoryName);
    });
});
