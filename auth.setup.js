const { test: setup, expect } = require('@playwright/test');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
    const URL = process.env.URL || 'https://tharwah.qa/';
    const loginURL = URL.endsWith('/') ? `${URL}login` : `${URL}/login`;
    const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
    const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

    await page.goto(loginURL);
    await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
    await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Log in' }).click();

    // Wait for dashboard or any authenticated content
    await page.getByRole('button', { name: 'Recyclables Settings' }).waitFor({ state: 'visible', timeout: 30000 });

    // End of authentication steps.
    await page.context().storageState({ path: authFile });
});
