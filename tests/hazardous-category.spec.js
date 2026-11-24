// @ts-check
// Ported from QA master: hazardouscategory.spec.js
import path from 'path';
import { authTest as test, expect, DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON } from '../fixtures/fixtures.js';

const TEST_IMAGE = path.resolve(__dirname, 'assets/test-image.png');

test.describe('Hazardous Category - Add Category modal', () => {
  test.beforeEach(async ({ hazardousCategoryPage }) => {
    await hazardousCategoryPage.goto();
  });

  test('validates mandatory fields', async ({ hazardousCategoryPage, blockedWrites }) => {
    // Known app defect (found 12 Nov 2026): the form has no client-side validation. An empty Create
    // POSTs blank names to /dashboard/hazardous-category/add/ and shows no error. Recyclables Category
    // validates correctly. Remove this line once fixed; Playwright flags it when the test starts passing.
    test.fail(true, 'Known defect: Hazardous Add Category submits empty form without validation errors');

    await hazardousCategoryPage.openAddCategoryModal();
    await hazardousCategoryPage.submit();
    await expect(hazardousCategoryPage.errorMessage('English name is required')).toBeVisible();
    await expect(hazardousCategoryPage.errorMessage('Arabic name is required')).toBeVisible();
    expect(blockedWrites, 'empty form must not be sent to the server').toEqual([]);
  });

  test('adds a new hazardous category with an image', async ({ hazardousCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    const id = Date.now();
    const name = `Haz_Test_${id}`;

    await hazardousCategoryPage.openAddCategoryModal();
    await hazardousCategoryPage.fillCategoryDetails({ englishName: name, arabicName: `خطر_اختبار_${id}`, status: 'Inactive' });
    await hazardousCategoryPage.uploadImage(TEST_IMAGE);
    await hazardousCategoryPage.submit();
    await hazardousCategoryPage.expectCategoryInGrid(name, 'Inactive');
  });

  test('boundary: 101-character English name', async ({ hazardousCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    await hazardousCategoryPage.openAddCategoryModal();
    await hazardousCategoryPage.fillCategoryDetails({ englishName: 'H'.repeat(101), arabicName: 'اختبار' });
    await hazardousCategoryPage.submit();
    // Expected behaviour (error vs. truncation) is not yet defined; the original test asserted nothing here.
  });

  test('accepts English and Arabic names', async ({ hazardousCategoryPage }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    const name = `Haz_Multilang_${Date.now()}`;

    await hazardousCategoryPage.openAddCategoryModal();
    await hazardousCategoryPage.fillCategoryDetails({ englishName: name, arabicName: `تصنيف_خطير_${Date.now()}` });
    await hazardousCategoryPage.submit();
    await hazardousCategoryPage.expectCategoryInGrid(name);
  });
});
