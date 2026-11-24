// @ts-check
// Ported from QA master: recyclablesproducts.spec.js, updated to the current form
// (Rate, Unit, CO2 Factor and Description fields no longer exist; Is Payable, Is Kg and Status were added).
import path from 'path';
import { authTest as test, expect, DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON } from '../fixtures/fixtures.js';

const TEST_IMAGE = path.resolve(__dirname, 'assets/test-image.png');

test.describe('Recyclables Product - Add Product modal', () => {
  test.beforeEach(async ({ recyclablesProductPage }) => {
    await recyclablesProductPage.goto();
  });

  test('shows the expected form fields with defaults', async ({ recyclablesProductPage: p }) => {
    await p.openAddProductModal();
    await expect(p.categoryCombobox).toBeVisible();
    await expect(p.arabicNameInput).toBeEmpty();
    await expect(p.englishNameInput).toBeEmpty();
    await expect(p.productImageButton).toBeVisible();
    await expect(p.isPayableCombobox).toHaveText('Yes');
    await expect(p.isKgCombobox).toHaveText('Yes');
    await expect(p.statusCombobox).toHaveText('Active');
    await p.closeModal();
  });

  test('validates mandatory fields', async ({ page, recyclablesProductPage: p, blockedWrites }) => {
    await p.openAddProductModal();
    await p.createButton.click();

    for (const message of [
      'Category is required',
      'Product name (Arabic) is required',
      'Product name (English) is required',
    ]) {
      await expect(page.getByText(message)).toBeVisible();
    }
    expect(blockedWrites, 'empty form must not be sent to the server').toEqual([]);
  });

  test('adds a new product with an image', async ({ recyclablesProductPage: p }) => {
    test.skip(!DATA_CHANGES_ALLOWED, DATA_CHANGES_SKIP_REASON);
    const name = `Recycle_${Date.now()}`;

    await p.openAddProductModal();
    await p.selectFirstOption(p.categoryCombobox);
    await p.arabicNameInput.fill(`إعادة تدوير_${Date.now()}`);
    await p.englishNameInput.fill(name);
    await p.uploadImage(TEST_IMAGE);
    await p.createButton.click();

    await expect(p.modalHeading).toBeHidden({ timeout: 15_000 });
    await p.searchInput.fill(name);
    await expect(p.productRow(name)).toBeVisible();
  });

  test('records how a 101-character English name is handled', async ({ recyclablesProductPage: p }) => {
    await p.openAddProductModal();
    await p.englishNameInput.fill('A'.repeat(101));
    const length = (await p.englishNameInput.inputValue()).length;
    // No character limit is specified yet; record the observed value in the report instead of guessing.
    test.info().annotations.push({ type: 'English name length kept after typing 101 chars', description: String(length) });
    expect(length).toBeGreaterThan(0);
    await p.closeModal(); // nothing is saved
  });

  test('accepts English and Arabic input', async ({ recyclablesProductPage: p }) => {
    await p.openAddProductModal();
    await p.englishNameInput.fill('Trial Product');
    await p.arabicNameInput.fill('منتج تجريبي');
    await expect(p.englishNameInput).toHaveValue('Trial Product');
    await expect(p.arabicNameInput).toHaveValue('منتج تجريبي');
    await p.closeModal(); // nothing is saved
  });
});
