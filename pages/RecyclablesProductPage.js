// @ts-check
import { expect } from '@playwright/test';

export const RECYCLABLES_PRODUCT_PATH = '/admin/recyclables-product';

export class RecyclablesProductPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Recyclables Product', level: 4 });
    this.addProductButton = page.getByRole('button', { name: 'Add Product' });
    this.modalHeading = page.getByRole('heading', { name: 'Add Product' });
    this.englishNameInput = page.getByRole('textbox', { name: 'Product Name (English)' });
    this.arabicNameInput = page.getByRole('textbox', { name: 'Product Name (Arabic)' });
    // Form fields as of Nov 2026 (Rate, Unit, CO2 Factor and Description were removed from this form).
    this.dialog = page.getByRole('dialog', { name: 'Add Product' });
    this.categoryCombobox = this.dialog.getByRole('combobox', { name: /Category Name/ });
    this.isPayableCombobox = this.dialog.getByRole('combobox', { name: /Is Payable/ });
    this.isKgCombobox = this.dialog.getByRole('combobox', { name: /Is Kg/ });
    this.statusCombobox = this.dialog.getByRole('combobox', { name: /Status/ });
    this.productImageButton = page.getByRole('button', { name: 'Product Image' });
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.searchInput = page.getByPlaceholder('Search product');
  }

  async goto() {
    await this.page.goto(RECYCLABLES_PRODUCT_PATH);
    await expect(this.page).toHaveURL(new RegExp(`${RECYCLABLES_PRODUCT_PATH}/?$`));
    await expect(this.heading).toBeVisible();
  }

  async openAddProductModal() {
    await this.addProductButton.click();
    await expect(this.modalHeading).toBeVisible();
  }

  async closeModal() {
    await this.cancelButton.click();
    await expect(this.modalHeading).toBeHidden();
  }

  /** @param {import('@playwright/test').Locator} combobox */
  async selectFirstOption(combobox) {
    await combobox.click();
    await this.page.getByRole('option').first().click();
  }

  /** @param {string} filePath */
  async uploadImage(filePath) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.productImageButton.click();
    await (await fileChooserPromise).setFiles(filePath);
  }

  /** @param {string} name */
  productRow(name) {
    return this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
  }
}
