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

    const resultsList = this.page.locator('[data-test-id="search-results-list"]');
    const hotelItems = this.page.locator('section[data-test-result-item-uniq-id]');

    try {
      await expect(resultsList).toBeVisible({ timeout: 30_000 });
    } catch {
      await expect(hotelItems.first()).toBeVisible({ timeout: 10_000 });
    }

    console.log('[TUI] Results loaded');
  }

  async openFirstHotel(): Promise<string> {
    await this.waitForResults();
    await this.preparePage();

    const resultsList = this.page.locator('[data-test-id="search-results-list"]');
    await expect(resultsList).toBeVisible({ timeout: 10_000 });

    const resultItem = this.page.locator('section[data-test-result-item-uniq-id]').first();
    const hotelLink = resultItem.locator('.ResultListItemV2__details h5 a');

    await this.acceptCookiesIfPresent().catch(() => {});
    await this.hideOverlays().catch(() => {});

    await hotelLink.scrollIntoViewIfNeeded().catch(() => {});

    const hotelName = await hotelLink.innerText().catch(() => 'Unknown');
    console.log(`Attempting to click hotel link: "${hotelName}"`);

    await hotelLink.click();
    await this.page.waitForLoadState('domcontentloaded');

    const hotelPage = new TuiHotelDetailsPage(this.page);
    await hotelPage.waitUntilLoaded();
    const name = await hotelPage.getHotelName().catch(() => '');
    console.log(`Opened hotel: ${name}`);
    return name;
  }

  async pickSearchResult(resultIndex: number = 0): Promise<string> {
    await this.waitForResults();
    await this.preparePage();

    const resultItem = this.page.locator('section[data-test-result-item-uniq-id]').nth(resultIndex);
    const hotelLink = resultItem.locator('.ResultListItemV2__details h5 a');

    await this.acceptCookiesIfPresent().catch(() => {});
    await this.hideOverlays().catch(() => {});

    await hotelLink.scrollIntoViewIfNeeded().catch(() => {});
    await hotelLink.click();

    await this.page.waitForLoadState('domcontentloaded');

    const hotelPage = new TuiHotelDetailsPage(this.page);
    await hotelPage.waitUntilLoaded();
    return await hotelPage.getHotelName().catch(() => '');
  }
}
