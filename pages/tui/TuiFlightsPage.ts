import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/utils/BasePage';
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
      if (await btn.count() && await btn.isVisible().catch(() => false)) {
        await btn.click().catch(async () => {
          await btn.click({ force: true }).catch(() => {});
        });
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      const fallback = this.page.locator('button').filter({ has: this.page.locator('.buttons__primary') }).first();
      if (await fallback.count() && await fallback.isVisible().catch(() => false)) {
        await fallback.click().catch(async () => {
          await fallback.click({ force: true }).catch(() => {});
        });
        clicked = true;
      }
    }
    if (!clicked) throw new Error('No continue/next/Boek Nu button found on flights page');
    await this.page.waitForURL(/\/h\/nl\/book\/flow\/summary/, { timeout: 30_000 });
    return;

    const additionalCandidates = [
      this.page.locator('button:has-text("Proceed")').first(),
      this.page.locator('button[data-testid="continue-button"]').first(),
    ];

    for (const cand of additionalCandidates) {
      try {
        if ((await cand.count()) && (await cand.isVisible().catch(() => false))) {
          await cand.click().catch(async () => {
            await cand.click({ force: true }).catch(() => {});
          });
          return;
        }
      } catch {
      }
    }

    await this.hideOverlays().catch(() => {});
    try {
      await this.page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => /doorgaan|verder|continue|next/i.test(b.textContent || '')) as HTMLButtonElement | undefined;
        if (btn) btn.click();
      });
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      if (this.page.url().includes('/book/flow/summary')) return;
    } catch {}

    try {
      const summary = new TuiSummaryBookingPage(this.page);
      await summary.pageLoaded().catch(async () => {
        await summary.navigate();
      });
      await summary.proceedBooking();
      return;
    } catch (err) {
    }

    try {
      const fallbackButton = this.page.locator('button').filter({ hasText: /continue|next|proceed|doorgaan|verder/i });
      await expect(fallbackButton.first()).toBeVisible({ timeout: 5_000 });
      await fallbackButton.first().click();
      return;
    } catch {
    }

    throw new Error('Continue button on flights page not found');
  }
}
