import { test, Page } from '@playwright/test';
import { Fragment } from '@/pages/core';
import { NetworkCounter, WaitForIdleOptions } from '@/pages/core/NetworkCounter';

export class BasePage<T> extends Fragment<T> {
  private readonly network: NetworkCounter;

  constructor(locators: T, page: Page) {
    super(locators, page);
    this.network = new NetworkCounter(page);
  }

  async waitNetworkIdle(options?: WaitForIdleOptions) {
    const { elapsed, count } = await this.network.isIdle(options);
    await test.step(`elapsed: ${elapsed} ms, finished ${count} request(s)`, async () => {
      await this.page.waitForLoadState('domcontentloaded');
    });
  }

  async open(url: string) {
    await this.page.goto(url);
    await this.page.waitForURL(url);
  }

  async acceptCookiesIfPresent() {
    const banners = [
      '#__tealiumGDPRecModal',
      '#cmNotifyBanner',
      '[id*="cookie"]',
      '[class*="cookie"]',
      '.privacy_prompt.explicit_consent',
    ];
    for (const sel of banners) {
      const banner = this.page.locator(sel).first();
      if (!(await banner.isVisible().catch(() => false))) continue;

      const acceptButton = banner.getByRole('button', {
        name: /accept|agree|ok|continue|got it|understood|akkoord|accepteren|alles accepteren|accepteer|ja|yes|toestaan|allow|accept all|accept cookies|sluiten|close|doorgaan|verder|bevestigen|instemmen|toestaan|accepteer alle/i,
      });
      if (await acceptButton.isVisible().catch(() => false)) {
        await acceptButton.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(500);
        continue;
      }
      const allButtons = banner.locator('button');
      const btnCount = await allButtons.count();
      for (let i = 0; i < btnCount; i++) {
        const btn = allButtons.nth(i);
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ force: true }).catch(() => {});
          await this.page.waitForTimeout(500);
        }
      }
      const clickable = banner
        .locator('div[role="button"], span[role="button"], a[role="button"]')
        .first();
      if (await clickable.isVisible().catch(() => false)) {
        await clickable.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(500);
        continue;
      }
      try {
        await banner.click({ force: true, timeout: 1000 });
        await this.page.waitForTimeout(500);
      } catch {}
    }
  }

  async dismissShortlistModalIfPresent(): Promise<void> {
    const modal = this.page.getByRole('dialog', { name: /create a shortlist/i });

    if ((await modal.count()) === 0) return;
    if (!(await modal.isVisible())) return;

    const cancelBtn = modal.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.count()) {
      await cancelBtn.click();
      return;
    }

    const closeBtn = modal.locator('button:has(svg)').first();
    if (await closeBtn.count()) {
      await closeBtn.click();
    }
  }

  async hideOverlays() {
    await this.page.evaluate(() => {
      const ids = ['__tealiumGDPRecModal', 'cmNotifyBanner'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el instanceof HTMLElement) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.pointerEvents = 'none';
        }
      }

      const possibleBackdrops = document.querySelectorAll(
        '[class*="modal"], [class*="overlay"], [id*="tealium"], [id*="cookie"]'
      );
      possibleBackdrops.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.pointerEvents = 'none';
        }
      });
    });
  }

  async preparePage() {
    await this.acceptCookiesIfPresent();
    await this.hideOverlays();
  }

  async dismissNewsletterPopupIfPresent() {
    await this.page.waitForTimeout(2000);

    const popup = this.page.locator('#opti-crm-popup, .opti-popup');
    let visible = false;

    try {
      visible = await popup.first().isVisible({ timeout: 1000 });
    } catch {
      visible = false;
    }

    if (!visible) return;

    const closeCandidate = popup.locator(
      [
        '.opti-close',
        'button[aria-label="Close"]',
        'button:has-text("×")',
        'button:has-text("Remind me later")',
        'a:has-text("Remind me later")',
      ].join(', ')
    );

    try {
      if (await closeCandidate.first().isVisible({ timeout: 1000 })) {
        await closeCandidate.first().click({ force: true });
        await popup
          .first()
          .waitFor({ state: 'hidden', timeout: 5000 })
          .catch(() => {});
        return;
      }
    } catch {}

    await this.page.evaluate(() => {
      const el = document.querySelector('#opti-crm-popup') || document.querySelector('.opti-popup');
      if (el && el.parentElement) {
        el.parentElement.removeChild(el);
      }
    });
    await this.page.waitForTimeout(200);
  }
}
