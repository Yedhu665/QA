// @ts-check
import { expect } from '@playwright/test';

export const HAZARDOUS_CATEGORY_PATH = '/admin/hazardous-category';

export class HazardousCategoryPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Hazardous Category', level: 4 });
    this.addCategoryButton = page.getByRole('button', { name: 'Add Category' });
    this.modalHeading = page.getByRole('heading', { name: 'Add Category' });
    this.englishNameInput = page.getByRole('textbox', { name: 'Category Name (English)' });
    this.arabicNameInput = page.getByRole('textbox', { name: 'Category Name (Arabic)' });
    this.statusCombobox = page.locator('div[role="combobox"]').filter({ hasText: /Status/ });
    this.imageInput = page.locator('input[type="file"]');
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.searchInput = page.getByPlaceholder('Search category');
  }

  async goto() {
    await this.page.goto(HAZARDOUS_CATEGORY_PATH);
    await expect(this.page).toHaveURL(new RegExp(`${HAZARDOUS_CATEGORY_PATH}/?$`));
    await expect(this.heading).toBeVisible();
  }

  async openAddCategoryModal() {
    await this.addCategoryButton.click();
    await expect(this.modalHeading).toBeVisible();
  }

  /** @param {{ englishName?: string, arabicName?: string, status?: string }} details */
  async fillCategoryDetails(details) {
    if (details.englishName) await this.englishNameInput.fill(details.englishName);
    if (details.arabicName) await this.arabicNameInput.fill(details.arabicName);
    if (details.status) {
      await this.statusCombobox.click();
      await this.page.getByRole('option', { name: details.status }).click();
    }
  }

  /** @param {string} filePath */
  async uploadImage(filePath) {
    await this.imageInput.setInputFiles(filePath);
  }

  async submit() {
    await this.createButton.click();
  }

  /** Inline validation message under any field of the open form. */
  errorMessage(/** @type {string} */ text) {
    return this.page.locator('.MuiFormHelperText-root.Mui-error').filter({ hasText: text }).first();
  }

  /**
   * @param {string} name
   * @param {string} [status]
   */
  async expectCategoryInGrid(name, status) {
    await this.searchInput.fill(name);
    const row = this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
    await expect(row).toBeVisible({ timeout: 15_000 });
    if (status) await expect(row).toContainText(status);
  }
}
