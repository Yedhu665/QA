const { expect } = require('@playwright/test');

class HazardousCategoryPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.addCategoryButton = page.getByRole('button', { name: 'Add Category' });
        this.englishNameInput = page.getByRole('textbox', { name: 'Category Name (English)' });
        this.arabicNameInput = page.getByRole('textbox', { name: 'Category Name (Arabic)' });
        this.statusCombobox = page.locator('div[role="combobox"]').filter({ hasText: /Status/ });
        this.createButton = page.getByRole('button', { name: 'Create' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });
        this.searchCategoryInput = page.getByPlaceholder('Search category');
    }

    async goto() {
        await this.page.goto('https://tharwah.qa/hazardous-category');
        await expect(this.page).toHaveURL(/.*hazardous-category/);
    }

    async openAddCategoryModal() {
        await this.addCategoryButton.click();
        await expect(this.page.getByRole('heading', { name: 'Add Category' })).toBeVisible();
    }

    async fillCategoryDetails(details) {
        if (details.englishName) await this.englishNameInput.fill(details.englishName);
        if (details.arabicName) await this.arabicNameInput.fill(details.arabicName);

        if (details.status) {
            await this.statusCombobox.click();
            await this.page.getByRole('option', { name: details.status }).click();
        }
    }

    async uploadImage(filePath) {
        // Use setInputFiles on the hidden file input for reliability
        await this.page.setInputFiles('input[type="file"]', filePath);
    }

    async submit() {
        await this.createButton.click();
    }

    async expectErrorMessage(fieldLabel, expectedMessage) {
        // Find the error message contextually
        const error = this.page.locator('.MuiFormHelperText-root.Mui-error').filter({ hasText: expectedMessage }).first();
        await expect(error).toBeVisible({ timeout: 10000 });
    }

    async verifyCategoryInGrid(name, status) {
        await this.searchCategoryInput.fill(name);
        const row = this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
        await expect(row).toBeVisible({ timeout: 15000 });
        if (status) {
            await expect(row).toContainText(status);
        }
    }
}

module.exports = { HazardousCategoryPage };
