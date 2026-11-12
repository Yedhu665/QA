// @ts-check
import { expect } from '@playwright/test';

/** Landing route after a successful login (observed on the live app). */
export const DASHBOARD_PATH = '/admin';

export class DashboardPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.navigation = page.getByRole('navigation');
    this.dashboardLink = this.navigation.getByRole('link', { name: 'Dashboard' });
    // The avatar/account button in the header has no accessible name; it is the last header button.
    this.accountMenuButton = page.getByRole('banner').getByRole('button').last();
    this.accountMenu = page.getByRole('menu');
    this.signOutItem = page.getByRole('menuitem', { name: 'Sign Out' });
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${DASHBOARD_PATH}/?$`));
    await expect(this.page).toHaveTitle('Tharwah - Dashboard');
    await expect(this.dashboardLink).toBeVisible();
  }

  async signOut() {
    await this.accountMenuButton.click();
    await expect(this.signOutItem).toBeVisible();
    const [response] = await Promise.all([
      this.page.waitForResponse(r => r.url().includes('/dashboard/auth/logout/')),
      this.signOutItem.click(),
    ]);
    return response;
  }
}
