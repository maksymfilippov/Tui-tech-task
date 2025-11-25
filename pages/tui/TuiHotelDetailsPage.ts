import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiSummaryBookingPage } from './TuiSummaryBookingPage';

const selectors = {
  hotelTitle: 'h1',
  continueButton: 'button:has-text("Continue"), .ProgressbarNavigation__summaryButton',
  heroBanner: '[aria-label*="unit details hero"], [aria-label*="nanner"]',
  progressBar: '#progressBarNavigation__component',
  overview: '#OverviewComponentContainer',
} as const;

export class TuiHotelDetailsPage extends BasePage<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async waitUntilLoaded(): Promise<void> {
    try {
      await this.page.waitForLoadState('domcontentloaded');

      const candidates = [
        selectors.heroBanner,
        selectors.progressBar,
        selectors.overview,
        selectors.hotelTitle,
      ];

      for (const sel of candidates) {
        try {
          await this.page.waitForSelector(sel, { timeout: 5_000, state: 'visible' });
          return;
        } catch {}
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes('Target page') ||
        errorMessage.includes('has been closed') ||
        errorMessage.includes('Page closed')
      ) {
        throw new Error(
          'Hotel details page was closed or a popup was used. Ensure the hotel link opens a page Playwright can attach to. Original: ' +
            String(err)
        );
      }
      throw err;
    }
  }

  async getHotelName(): Promise<string> {
    await this.waitUntilLoaded();
    const title = this.locators.hotelTitle.first();
    await expect(title).toBeVisible();
    return (await title.innerText()).trim();
  }

  async proceedBooking(): Promise<TuiSummaryBookingPage> {
    await this.waitUntilLoaded();

    const btn = this.page.locator('.ProgressbarNavigation__summaryButton');
    await expect(btn).toBeVisible({ timeout: 30000 });

    const ctx = this.page.context();

    const popupPromise = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
    const navPromise = this.page
      .waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: 40000,
      })
      .catch(() => null);

    await btn.click();

    const popup = await popupPromise;
    const nav = await navPromise;

    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      const popupUrl = popup.url();

      if (!this.page.isClosed()) {
        await this.page.goto(popupUrl, { waitUntil: 'domcontentloaded', timeout: 40000 });
      }

      await popup.close().catch(() => {});
    } else if (!nav) {
      await this.page.waitForURL(/\/(h\/)?nl\/book\/flow\/summary/, { timeout: 40000 });
    }
    const summaryPage = new TuiSummaryBookingPage(this.page);
    await summaryPage.pageLoaded();
    return summaryPage;
  }
}
