// @ts-check
// Ported from QA master: dashboard.spec.js
import { authTest as test, expect } from '../fixtures/fixtures.js';
import { DASHBOARD_PATH } from '../pages/DashboardPage.js';

test.describe('Dashboard', () => {
  test('opens from the sidebar, shows content and scrolls to the bottom', async ({ page, dashboardPage }) => {
    await page.goto(DASHBOARD_PATH);
    await dashboardPage.dashboardLink.click();
    await dashboardPage.expectLoaded();
    await expect(page.getByRole('heading', { name: 'Active Customers' })).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD_PATH}/?$`));
  });
});
