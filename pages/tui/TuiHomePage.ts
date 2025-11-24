import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import {
  TuiDepartureAirport,
  TuiDestinationAirport,
  TuiDepartureDate,
  TuiRoomsAndGuests,
} from '@/pages/components';
import { TIMEOUTS, SELECTORS } from '@/internal/config/constants';

const selectors = {
  departureInput: SELECTORS.DEPARTURE_INPUT,
  destinationInput: SELECTORS.DESTINATION_INPUT,
  roomsGuestsButton: SELECTORS.ROOMS_GUESTS_BUTTON,
  searchButton: SELECTORS.SEARCH_BUTTON,
} as const;

export class TuiHomePage extends BasePage<typeof selectors> {
  readonly departureAirport: TuiDepartureAirport;
  readonly destinationAirport: TuiDestinationAirport;
  readonly departureDate: TuiDepartureDate;
  readonly roomsAndGuests: TuiRoomsAndGuests;

  constructor(page: Page) {
    super(selectors, page);

    this.departureAirport = new TuiDepartureAirport(page);
    this.destinationAirport = new TuiDestinationAirport(page);
    this.departureDate = new TuiDepartureDate(page);
    this.roomsAndGuests = new TuiRoomsAndGuests(page);
  }

  async open(): Promise<void> {
    await this.page.goto('/h/nl', { waitUntil: 'domcontentloaded' });

    await this.acceptCookiesIfPresent();
    await this.hideOverlays();

    console.log('[TUI] Homepage opened & prepared');
  }

  async acceptCookiesIfPresent(): Promise<void> {
    const buttonSelectors = [
      '#cmNotifyBanner button',
      '#__tealiumGDPRecModal button',
      'button:has-text("Akkoord")',
      'button:has-text("Accepteer")',
      'button:has-text("Accepteren")',
      'button:has-text("Alles accepteren")',
      'button:has-text("Accept")',
    ];

    for (const selector of buttonSelectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 500 })) {
          await button.click({ force: true, timeout: 3_000 });
          await this.page.waitForTimeout(TIMEOUTS.COOKIE_CLICK_DELAY);
          console.log('Cookies banner accepted');

          await this.page
            .evaluate(() => {
              const banner = document.querySelector('#cmNotifyBanner, #__tealiumGDPRecModal');
              if (banner) banner.remove();
            })
            .catch(() => {});
          return;
        }
      } catch {
        continue;
      }
    }
  }

  async ensureReady(): Promise<void> {
    await this.acceptCookiesIfPresent();
  }

  async selectRandomDepartureAirportNL(): Promise<string> {
    await this.ensureReady();
    const name = await this.departureAirport.selectDepartureAirport();
    console.log('\n[TUI] Departure airport selected\n' + name);
    return name;
  }

  async selectRandomDestinationAirport(): Promise<string> {
    await this.ensureReady();
    const { country, city } = await this.destinationAirport.setDestination();
    const full = `${country} — ${city}`;
    console.log('\n[TUI] Destination selected\n' + full);
    return full;
  }

  async selectAnyAvailableDepartureDate(): Promise<string> {
    await this.ensureReady();
    const date = await this.departureDate.setDepartureDate('3');
    console.log('\n[TUI] Departure date selected\n' + date);
    return date;
  }

  // Select destination and date with automatic retry on failure
  // If dates are unavailable for selected destination, reloads page and tries different destination
  async selectDestinationAndDateWithRetry(maxRetries: number = 3): Promise<void> {
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.selectRandomDestinationAirport();
        await this.selectAnyAvailableDepartureDate();
        return;
      } catch (error: unknown) {
        retryCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`Attempt ${retryCount} failed: ${errorMessage}`);

        if (retryCount < maxRetries) {
          console.log('Retrying with different destination...');
          await this.page.reload();
          await this.ensureReady();
          await this.selectRandomDepartureAirportNL();
          // Continue to next iteration to select new destination and date
        } else {
          throw error;
        }
      }
    }
  }

  async search(): Promise<void> {
    const button = this.page.locator(selectors.searchButton).first();

    await expect(button).toBeVisible({ timeout: 10_000 });
    await button.click();

    console.log('[TUI] Search triggered');
  }
}
