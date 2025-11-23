import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiPassengerDetailsPage } from './TuiPassengerDetailsPage';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class TuiSummaryBookingPage extends BasePage<{}> {
  private readonly pagePrefix = '/h/nl/book/flow/summary';

  constructor(page: Page) {
    super({}, page);
  }

  async pageLoaded(): Promise<this> {
    await this.page.waitForURL(/.*\/h\/nl\/book\/flow\/summary.*/, {
      timeout: 50000,
      waitUntil: 'domcontentloaded',
    });

    const header = this.page.locator('h1').filter({ hasText: /Vakantie samenstellen/i });
    await expect(header).toBeVisible({ timeout: 30000 });

    return this;
  }

  async navigate(): Promise<this> {
    throw new Error('Method not implemented.');
  }

  async proceedBooking(): Promise<TuiPassengerDetailsPage> {
    const btn = this.page.locator('.ProgressbarNavigation__summaryButton button');
    await expect(btn).toBeVisible({ timeout: 30000 });
    await btn.click();

    const passengerPage = new TuiPassengerDetailsPage(this.page);
    await passengerPage.pageLoaded();
    return passengerPage;
  }
}
