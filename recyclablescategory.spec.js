const { test, expect } = require('@playwright/test');
const { RecyclablesCategoryPage } = require('./pages/RecyclablesCategoryPage');
const path = require('path');

test.describe('Recyclables Category - Add Category Modal', () => {
  let categoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new RecyclablesCategoryPage(page);
    // Storage state handles login automatically
    await page.goto(process.env.URL || 'https://tharwah.qa/');
    await categoryPage.goto();
  });

  test('Validate mandatory fields', async () => {
    await categoryPage.openAddCategoryModal();
    await categoryPage.submit();

    await categoryPage.expectErrorMessage('Category Name (English)', 'English name is required');
    await categoryPage.expectErrorMessage('Category Name (Arabic)', 'Arabic name is required');
  });

  test('Positive Testing - Add New Category with Image', async () => {
    const uniqueId = Date.now();
    const categoryName = `Test_Category_${uniqueId}`;
    const categoryNameAr = `تصنيف_اختبار_${uniqueId}`;

    await categoryPage.openAddCategoryModal();
    await categoryPage.fillCategoryDetails({
      englishName: categoryName,
      arabicName: categoryNameAr,
      isPayable: 'No',
      status: 'Inactive',
      imagePath: path.resolve(__dirname, 'motor_category.jpeg')
    });

    await categoryPage.submit();

    // Verify creation
    await categoryPage.verifyCategoryInGrid(categoryName, 'No');
  });

  test('Boundary and Negative Testing - Long Name', async () => {
    const longName = 'A'.repeat(101); // Assuming 100 character limit

    await categoryPage.openAddCategoryModal();
    await categoryPage.fillCategoryDetails({
      englishName: longName,
      arabicName: 'اختبار'
    });

    await categoryPage.submit();
    // Check if there's any validation or if it truncates (logic depends on APP behavior)
    // For now, just ensure it submits or shows an error
  });

  test('Multilingual Input Validation', async () => {
    const categoryName = `Multilang_${Date.now()}`;
    const categoryNameAr = `التصنيف_العربي_${Date.now()}`;

    await categoryPage.openAddCategoryModal();
    await categoryPage.fillCategoryDetails({
      englishName: categoryName,
      arabicName: categoryNameAr
    });

    await categoryPage.submit();
    await categoryPage.verifyCategoryInGrid(categoryName);
  });
});
