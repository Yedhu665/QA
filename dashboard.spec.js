const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env in the current folder
dotenv.config({ path: path.resolve(__dirname, '.env'), override: true });

const URL = process.env.URL;
const USERNAME = process.env.APP_USERNAME || process.env.USERNAME;
const PASSWORD = process.env.APP_PASSWORD || process.env.PASSWORD;

if (!URL || !USERNAME || !PASSWORD) {
  throw new Error('Missing required environment variables. Make sure .env defines URL, USERNAME, and PASSWORD.');
}

test('go to url from .env, login, click dashboard and scroll page', async ({ page }) => {
  // 1) Navigate to the URL from the .env file
  await page.goto(URL);

  // 2) Login using credentials from .env
  await page.getByRole('textbox', { name: 'Username' }).fill(USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();

  // 3) Click the dashboard field
  // The dashboard link is a role="link" with name "Dashboard"
  await page.getByRole('link', { name: 'Dashboard' }).click();

  // 4) Wait for dashboard content to be visible
  await expect(page.getByRole('heading', { name: 'Active Customers' })).toBeVisible();

  // 5) Scroll the page to the bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  // Final assertion (URL might just be the root)
  await expect(page).toHaveURL(URL);
});
