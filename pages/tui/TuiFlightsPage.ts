import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { TuiSummaryBookingPage } from './TuiSummaryBookingPage';

const selectors = {
  outboundFlight: '[data-testid="outbound-flight"]:first-child',
  inboundFlight: '[data-testid="inbound-flight"]:first-child',
  continueButton: 'button:has-text("Continue")',
} as const;

export class TuiFlightsPage extends BasePage<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async selectAvailableFlights() {
    await this.locators.outboundFlight.click();
    await this.locators.inboundFlight.click();
  }

  // Continue to passengers page with fallback to summary page if needed
  // Handles cases where flight selection redirects to summary instead of passenger details
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

  async continueToPassengers() {
    const selectors = [
      '.ProgressbarNavigation__summaryButton button',
      '.buttons__button.buttons__primary.buttons__fill',
      'button:has-text("Boek Nu")',
      'button:has-text("Continue")',
      'button:has-text("Doorgaan")',
      'button:has-text("Verder")',
      'button:has-text("Next")',
    ];
    let clicked = false;
    for (const sel of selectors) {
      const btn = this.page.locator(sel).first();
      if ((await btn.count()) && (await btn.isVisible().catch(() => false))) {
        await btn.click().catch(async () => {
          await btn.click({ force: true }).catch(() => {});
        });
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      const fallback = this.page
        .locator('button')
        .filter({ has: this.page.locator('.buttons__primary') })
        .first();
      if ((await fallback.count()) && (await fallback.isVisible().catch(() => false))) {
        await fallback.click().catch(async () => {
          await fallback.click({ force: true }).catch(() => {});
        });
        clicked = true;
      }
    }
    if (!clicked) throw new Error('No continue/next/Boek Nu button found on flights page');
    await this.page.waitForURL(/\/h\/nl\/book\/flow\/summary/, { timeout: 30_000 });
  }
}
