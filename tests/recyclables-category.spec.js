// @ts-check
// Ported from QA master: recyclablescategory.spec.js
import path from 'path';
import { authTest as test, expect, DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON } from '../fixtures/fixtures.js';

const TEST_IMAGE = path.resolve(__dirname, 'assets/test-image.png');

test.describe('Recyclables Category - Add Category modal', () => {
  test.beforeEach(async ({ recyclablesCategoryPage }) => {
    await recyclablesCategoryPage.goto();
  });

  test('validates mandatory fields', async ({ recyclablesCategoryPage, blockedWrites }) => {
    await recyclablesCategoryPage.openAddCategoryModal();
    await recyclablesCategoryPage.submit();
    await expect(recyclablesCategoryPage.fieldError('Category Name (English)')).toHaveText('English name is required');
    await expect(recyclablesCategoryPage.fieldError('Category Name (Arabic)')).toHaveText('Arabic name is required');
    expect(blockedWrites, 'empty form must not be sent to the server').toEqual([]);
  });

  test('adds a new category with an image', async ({ recyclablesCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    const id = Date.now();
    const name = `Test_Category_${id}`;

    await recyclablesCategoryPage.openAddCategoryModal();
    await recyclablesCategoryPage.fillCategoryDetails({
      englishName: name,
      arabicName: `تصنيف_اختبار_${id}`,
      isPayable: 'No',
      status: 'Inactive',
      imagePath: TEST_IMAGE,
    });
    await recyclablesCategoryPage.submit();
    await recyclablesCategoryPage.expectCategoryInGrid(name, 'No');
  });

  test('boundary: 101-character English name', async ({ recyclablesCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    await recyclablesCategoryPage.openAddCategoryModal();
    await recyclablesCategoryPage.fillCategoryDetails({ englishName: 'A'.repeat(101), arabicName: 'اختبار' });
    await recyclablesCategoryPage.submit();
    // Expected behaviour (error vs. truncation) is not yet defined; the original test asserted nothing here.
  });

  test('accepts English and Arabic names', async ({ recyclablesCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    const name = `Multilang_${Date.now()}`;

    await recyclablesCategoryPage.openAddCategoryModal();
    await recyclablesCategoryPage.fillCategoryDetails({ englishName: name, arabicName: `التصنيف_العربي_${Date.now()}` });
    await recyclablesCategoryPage.submit();
    await recyclablesCategoryPage.expectCategoryInGrid(name);
  });
});
