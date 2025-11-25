import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiSummaryBookingPage } from './TuiSummaryBookingPage';
import { TIMEOUTS } from '@/internal/config/constants';

const selectors = {
  outboundFlight: '[data-testid="outbound-flight"]:first-child',
  inboundFlight: '[data-testid="inbound-flight"]:first-child',
  continueButton:
    '[data-testid="continue-button"], .FlightResultsFooter button, .ProgressbarNavigation__flightButton button',
} as const;

export class TuiFlightsPage extends BasePage<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async pageLoaded(): Promise<this> {
    await expect(this.locators.outboundFlight.first()).toBeVisible({
      timeout: TIMEOUTS.PAGE_LOAD,
    });
    return this;
  }

  async selectAvailableFlights(): Promise<void> {
    await this.locators.outboundFlight.first().click();
    await this.locators.inboundFlight.first().click();
  }

  async continueToPassengersOrSummary(): Promise<void> {
    try {
      await this.continueToPassengers();
    } catch {
      let currentPage = this.page;
      try {
        const pages = this.page.context().pages();
        const alive = pages.reverse().find(p => !p.isClosed());
        currentPage = alive || this.page;
      } catch {}

      const summary = new TuiSummaryBookingPage(currentPage);
      await summary.pageLoaded();
      await summary.proceedBooking();
    }
  }

  async continueToPassengers(): Promise<void> {
    const continueButton = this.page
      .locator(
        'button:has-text("Doorgaan"), button:has-text("Verder"), [data-testid="continue-button"], .FlightResultsFooter button'
      )
      .first();

    await expect(continueButton).toBeVisible({ timeout: TIMEOUTS.PAGE_LOAD });
    await continueButton.scrollIntoViewIfNeeded();

    const ctx = this.page.context();

    const popupPromise = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
    const navPromise = this.page
      .waitForNavigation({
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUTS.PAGE_LOAD,
      })
      .catch(() => null);

    await continueButton.click();

    const popup = await popupPromise;
    await navPromise;

    if (popup) {
      try {
        await popup.waitForLoadState('domcontentloaded').catch(() => {});
        const popupUrl = popup.url();

        if (!this.page.isClosed()) {
          await this.page.goto(popupUrl, {
            waitUntil: 'domcontentloaded',
            timeout: TIMEOUTS.PAGE_LOAD,
          });
        }
      } finally {
        await popup.close().catch(() => {});
      }
    }

    await this.page.waitForURL(
      /\/(h\/)?nl\/book\/(flow\/summary|passengerdetails|passenger-details|passengers)/,
      { timeout: TIMEOUTS.PAGE_LOAD }
    );

    if (this.page.url().includes('/flow/summary')) {
      const summary = new TuiSummaryBookingPage(this.page);
      await summary.pageLoaded();
      await summary.proceedBooking();
    }
  }
}
