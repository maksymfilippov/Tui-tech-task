import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core/BasePage';
import { TuiPassengerDetailsPage } from './TuiPassengerDetailsPage';

const selectors = {};

export class TuiSummaryBookingPage extends BasePage<typeof selectors> {
  pagePrefix = '/nl/book/flow/summary';

  constructor(page: Page) {
    super(selectors, page);
  }

  async pageLoaded(): Promise<this> {
    await this.page.waitForURL(/\/(h\/)?nl\/book\/flow\/summary/, {
      timeout: 40000,
      waitUntil: 'domcontentloaded',
    });

    await expect(this.page.locator('h1').filter({ hasText: 'Vakantie samenstellen' })).toBeVisible({
      timeout: 40000,
    });

    return this;
  }

  async navigate(): Promise<this> {
    throw new Error('Method not implemented.');
  }

  async proceedBooking(): Promise<TuiPassengerDetailsPage> {
    const btn = this.page.locator('.ProgressbarNavigation__summaryButton button');

    const nextPageHeader = this.page.locator('h1.pageHeading', {
      hasText: /Persoonsgegevens/i,
    });

    await this.clickAndWaitFor(btn, nextPageHeader);

    return new TuiPassengerDetailsPage(this.page).pageLoaded();
  }
}
