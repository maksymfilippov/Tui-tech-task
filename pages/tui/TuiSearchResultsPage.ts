import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiHotelDetailsPage } from './TuiHotelDetailsPage';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class TuiSearchResultsPage extends BasePage<{}> {
  constructor(page: Page) {
    super({}, page);
  }

  async waitForResults(): Promise<void> {
    await this.acceptCookiesIfPresent().catch(() => {});
    await this.waitNetworkIdle({ timeout: 25_000 }).catch(() => {});

    const headerSelectors = [
      '[data-testid="results-header"]',
      'h1',
      'h2',
      '.SearchResults__header',
      'div',
    ];
    let header: ReturnType<Page['locator']> | null = null;
    for (const sel of headerSelectors) {
      const cand = this.page
        .locator(sel)
        .filter({ hasText: /hotel|vakantie|result|gevonden|results/i })
        .first();
      if ((await cand.count()) && (await cand.isVisible().catch(() => false))) {
        header = cand;
        break;
      }
    }

    if (!header) {
      header = this.page.locator('h1, h2, .SearchResults__header').first();
    }

    await expect(header).toBeVisible({ timeout: 30_000 });

    console.log('[TUI] Results loaded');
  }

  async openFirstHotel(): Promise<string> {
    await this.waitForResults();

    const trySelectors = [
      '.ResultListItemV2__details h5 a',
      'a[href*="/hotel/"], a[href*="/vakantie/"], a[href*="/pakketreizen/"]',
    ];

    for (const sel of trySelectors) {
      const items = this.page.locator(sel);
      const count = await items.count();
      if (!count) continue;

      for (let i = 0; i < count; i++) {
        const candidate = items.nth(i);
        const txt = (await candidate.innerText().catch(() => '')).trim();
        const href = (await candidate.getAttribute('href').catch(() => '')) || '';
        const vis = await candidate.isVisible().catch(() => false);

        if (!txt || /vakanties|home|zoeken|categorie|categorieën/i.test(txt)) continue;
        if (!vis) continue;

        await this.acceptCookiesIfPresent().catch(() => {});
        await this.hideOverlays().catch(() => {});

        const popupPromise = this.page.context().waitForEvent('page');
        await candidate.click().catch(async () => {
          await candidate.click({ force: true }).catch(() => {});
        });

        const newPage = await Promise.race([
          popupPromise.catch(() => null),
          new Promise(resolve => setTimeout(() => resolve(null), 1500)),
        ]);

        if (newPage) {
          await (newPage as any).waitForLoadState('domcontentloaded').catch(() => {});
          const hotelPage = new TuiHotelDetailsPage(newPage as any);
          await hotelPage.waitUntilLoaded();
          const name = await hotelPage.getHotelName().catch(() => '');
          console.log(`Opened hotel (popup): ${name}`);
          return name;
        }

        const hotelPage = new TuiHotelDetailsPage(this.page);
        await hotelPage.waitUntilLoaded();
        const name = await hotelPage.getHotelName().catch(() => '');
        console.log(`Opened hotel: ${name}`);
        return name;
      }
    }

    throw new Error('No suitable hotel link found to open');
  }

  async pickSearchResult(resultIndex: number = 0): Promise<string> {
    await this.waitForResults();

    const selector = '.ResultListItemV2__details h5 a';
    const items = this.page.locator(selector);
    if ((await items.count()) > resultIndex) {
      const candidate = items.nth(resultIndex);
      await this.acceptCookiesIfPresent().catch(() => {});
      await this.hideOverlays().catch(() => {});
      const popupPromise = this.page.context().waitForEvent('page');
      await candidate.click().catch(async () => {
        await candidate.click({ force: true }).catch(() => {});
      });

      const newPage = await Promise.race([
        popupPromise.catch(() => null),
        new Promise(resolve => setTimeout(() => resolve(null), 1200)),
      ]);

      if (newPage) {
        await (newPage as any).waitForLoadState('domcontentloaded').catch(() => {});
        const hotelPage = new TuiHotelDetailsPage(newPage as any);
        await hotelPage.waitUntilLoaded();
        return await hotelPage.getHotelName().catch(() => '');
      }

      const hotelPage = new TuiHotelDetailsPage(this.page);
      await hotelPage.waitUntilLoaded();
      return await hotelPage.getHotelName().catch(() => '');
    }

    return this.openFirstHotel();
  }
}
