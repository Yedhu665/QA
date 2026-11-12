// @ts-check
import { expect } from '@playwright/test';

export const RECYCLABLES_CATEGORY_PATH = '/admin/recyclables-category';

export class RecyclablesCategoryPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Recyclables Category', level: 4 });
    this.addCategoryButton = page.getByRole('button', { name: 'Add Category' });
    this.modalHeading = page.getByRole('heading', { name: 'Add Category' });
    this.englishNameInput = page.getByRole('textbox', { name: 'Category Name (English)' });
    this.arabicNameInput = page.getByRole('textbox', { name: 'Category Name (Arabic)' });
    this.isPayableCombobox = page.getByRole('combobox', { name: /Is Payable/ });
    this.statusCombobox = page.getByRole('combobox', { name: /Status/ });
    this.categoryImageButton = page.getByRole('button', { name: 'Category Image' });
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.searchInput = page.getByPlaceholder('Search category');
  }

  async goto() {
    await this.page.goto(RECYCLABLES_CATEGORY_PATH);
    await expect(this.page).toHaveURL(new RegExp(`${RECYCLABLES_CATEGORY_PATH}/?$`));
    await expect(this.heading).toBeVisible();
  }

  async openAddCategoryModal() {
    await this.addCategoryButton.click();
    await expect(this.modalHeading).toBeVisible();
  }

  /** @param {{ englishName?: string, arabicName?: string, isPayable?: string, status?: string, imagePath?: string }} details */
  async fillCategoryDetails(details) {
    if (details.englishName) await this.englishNameInput.fill(details.englishName);
    if (details.arabicName) await this.arabicNameInput.fill(details.arabicName);
    if (details.isPayable) {
      await this.isPayableCombobox.click();
      await this.page.getByRole('option', { name: details.isPayable }).click();
    }
    if (details.status) {
      await this.statusCombobox.click();
      await this.page.getByRole('option', { name: details.status }).click();
    }
    if (details.imagePath) {
      const fileChooserPromise = this.page.waitForEvent('filechooser');
      await this.categoryImageButton.click();
      await (await fileChooserPromise).setFiles(details.imagePath);
    }
  }

  async submit() {
    await this.createButton.click();
  }

  /** Validation message under the field with the given label. */
  fieldError(/** @type {string} */ label) {
    return this.page.locator('.MuiFormControl-root').filter({ hasText: label }).locator('.MuiFormHelperText-root.Mui-error');
  }

  /**
   * @param {string} name
   * @param {string} [isPayable]
   */
  async expectCategoryInGrid(name, isPayable) {
    await this.searchInput.fill(name);
    // Auto-retrying assertion waits for the search to filter the grid (replaces a fixed 2s wait).
    const row = this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    if (isPayable) await expect(row).toContainText(isPayable);
  }
}
