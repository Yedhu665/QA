const { expect } = require('@playwright/test');

class RecyclablesCategoryPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.addCategoryButton = page.getByRole('button', { name: 'Add Category' });
        this.englishNameInput = page.getByRole('textbox', { name: 'Category Name (English)' });
        this.arabicNameInput = page.getByRole('textbox', { name: 'Category Name (Arabic)' });
        this.isPayableCombobox = page.getByRole('combobox', { name: /Is Payable/ });
        this.statusCombobox = page.getByRole('combobox', { name: /Status/ });
        this.categoryImageButton = page.getByRole('button', { name: 'Category Image' });
        this.createButton = page.getByRole('button', { name: 'Create' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });
        this.searchCategoryInput = page.getByPlaceholder('Search category');
    }

    async goto() {
        await this.page.getByRole('button', { name: 'Recyclables Settings' }).click();
        await this.page.getByRole('link', { name: 'Recyclables Category' }).click();
        await expect(this.page).toHaveURL(/.*recyclables-category/);
    }

    async openAddCategoryModal() {
        await this.addCategoryButton.click();
        await expect(this.page.getByRole('heading', { name: 'Add Category' })).toBeVisible();
    }

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
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(details.imagePath);
        }
    }

    async submit() {
        await this.createButton.click();
    }

    async expectErrorMessage(labelText, expectedError) {
        const errorLocator = this.page.locator('.MuiFormControl-root').filter({ hasText: labelText }).locator('.MuiFormHelperText-root.Mui-error');
        await expect(errorLocator).toHaveText(expectedError);
    }

    async verifyCategoryInGrid(name, isPayable) {
        await this.searchCategoryInput.fill(name);
        await this.page.waitForTimeout(2000); // Give the list time to filter
        const row = this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
        await expect(row).toBeVisible();
        if (isPayable) {
            await expect(row).toContainText(isPayable);
        }
    }
}

module.exports = { RecyclablesCategoryPage };
