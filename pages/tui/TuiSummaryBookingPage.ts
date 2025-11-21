import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiPassengerDetailsPage } from './TuiPassengerDetailsPage';

const selectors = {
  pageHeader: 'h1',
  continueButton:
    '.ProgressbarNavigation__summaryButton button, button:has-text("Continue"), button:has-text("Doorgaan"), button:has-text("Verder")',
} as const;

export class TuiSummaryBookingPage extends BasePage<typeof selectors> {
  pagePrefix = '/h/nl/book/flow/summary';

  constructor(page: Page) {
    super(selectors, page);
  }

  async pageLoaded(): Promise<this> {
    await this.page.waitForURL(new RegExp(`.*${this.pagePrefix}.*`), { timeout: 40_000 });

    await this.acceptCookiesIfPresent().catch(() => {});
    await this.hideOverlays().catch(() => {});

    const header = this.page.locator(this.$.pageHeader).filter({
      hasText: /Vakantie samenstellen|Booking summary|Samenvatting|Samenvatting boeking/i,
    });
    await expect(header.first()).toBeVisible({ timeout: 20_000 });

    return this;
  }

  async navigate(): Promise<this> {
    try {
      const pages = this.page.context().pages();
      const existing = pages.find(p => p.url().includes(this.pagePrefix));
      if (existing && !existing.isClosed()) {
        this.page = existing as Page;
        await this.page.bringToFront();
        await this.pageLoaded();
        return this;
      }

      const lastAlive = pages.reverse().find(p => !p.isClosed());
      if (lastAlive) {
        this.page = lastAlive as Page;
        await this.page.bringToFront();
      }

      await this.page.goto(this.pagePrefix, { waitUntil: 'domcontentloaded' });
      await this.pageLoaded();
      return this;
    } catch (err) {
      try {
        const pages = this.page.context().pages();
        const found = pages.find(p => p.url().includes(this.pagePrefix) && !p.isClosed());
        if (found) {
          this.page = found as Page;
          await this.page.bringToFront();
          await this.pageLoaded();
          return this;
        }
      } catch {}
      throw new Error(`Navigation to summary page failed: ${err}`);
    }
  }

  async proceedBooking(): Promise<TuiPassengerDetailsPage> {
    const btn = this.page.locator('.ProgressbarNavigation__summaryButton button').first();
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click().catch(async () => {
      await btn.click({ force: true }).catch(() => {});
    });

    const passengerPage = new TuiPassengerDetailsPage(this.page);
    await passengerPage.pageLoaded();
    return passengerPage;
  }
}
