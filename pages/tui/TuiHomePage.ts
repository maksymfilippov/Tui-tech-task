import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import {
  TuiDepartureAirport,
  TuiDestinationAirport,
  TuiDepartureDate,
  TuiRoomsAndGuests,
} from '@/pages/components';
import { SELECTORS, TIMEOUTS } from '@/internal/config/constants';

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
    await this.page.goto('/h/nl', {
      timeout: TIMEOUTS.NAVIGATION,
      waitUntil: 'domcontentloaded',
    });
    await this.acceptCookiesIfPresent();
    console.log('[TUI] Homepage opened & cookies handled');
  }

  async selectRandomDepartureAirportNL(): Promise<string> {
    const name = await this.departureAirport.selectDepartureAirport();
    console.log('\n[TUI] Departure airport selected\n' + name);
    return name;
  }

  async selectRandomDestinationAirport(): Promise<string> {
    const { country, city } = await this.destinationAirport.setDestination();
    const full = `${country} — ${city}`;
    console.log('\n[TUI] Destination selected\n' + full);
    return full;
  }

  async selectAnyAvailableDepartureDate(): Promise<string> {
    const date = await this.departureDate.setDepartureDate('3');
    console.log('\n[TUI] Departure date selected\n' + date);
    return date;
  }

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
          await this.acceptCookiesIfPresent();
          await this.selectRandomDepartureAirportNL();
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
