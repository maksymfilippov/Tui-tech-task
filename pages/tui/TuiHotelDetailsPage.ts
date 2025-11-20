import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/utils/BasePage';

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
      await this.acceptCookiesIfPresent().catch(() => {});
      await this.hideOverlays().catch(() => {});
      await this.page.waitForLoadState('domcontentloaded');

      const candidates = [selectors.heroBanner, selectors.progressBar, selectors.overview, selectors.hotelTitle];

      await this.page.waitForFunction(
        (sels: string[]) => sels.some(s => !!document.querySelector(s)),
        candidates,
        { timeout: 25_000 }
      );

      for (const sel of candidates) {
        try {
          await this.page.waitForSelector(sel, { timeout: 5_000, state: 'visible' });
          return;
        } catch (err) {
        }
      }

      await this.page.waitForTimeout(1500);
    } catch (err: any) {
      if (String(err).includes('Target page') || String(err).includes('has been closed') || String(err).includes('Page closed')) {
        throw new Error('Hotel details page was closed or a popup was used. Ensure the hotel link opens a page Playwright can attach to. Original: ' + String(err));
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

  async continueToFlights(): Promise<void> {
    await this.waitUntilLoaded();

    const candidateSelectors = [this.$.continueButton, 'button:has-text("Continue")', 'button:has-text("Ga verder")', '.ProgressbarNavigation__summaryButton button'];

    for (const sel of candidateSelectors) {
      try {
        const locator = this.page.locator(sel).first();
        await expect(locator).toBeVisible({ timeout: 5_000 });
        await locator.click().catch(async () => {
          await locator.click({ force: true }).catch(async () => {
            await this.page.evaluate((s: string) => {
              const el = document.querySelector(s) as HTMLElement | null;
              if (el) el.click();
            }, sel).catch(() => {});
          });
        });
        return;
      } catch (err) {
      }
    }

    throw new Error('Could not find or click Continue button on hotel details page. Tried selectors: ' + candidateSelectors.join(', '));
  }
}
