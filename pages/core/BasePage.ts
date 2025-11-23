import { Page } from '@playwright/test';
import { Fragment } from '@/pages/core';
import {
  TIMEOUTS,
  COOKIE_SELECTORS,
  COOKIE_ACCEPT_PATTERN,
  OVERLAY_IDS,
} from '@/internal/config/constants';

export class BasePage<T> extends Fragment<T> {
  constructor(locators: T, page: Page) {
    super(locators, page);
  }

  async open(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async acceptCookiesIfPresent() {
    for (const sel of COOKIE_SELECTORS) {
      const banner = this.page.locator(sel).first();
      if (!(await banner.isVisible().catch(() => false))) continue;

      const acceptButton = banner.getByRole('button', {
        name: COOKIE_ACCEPT_PATTERN,
      });
      if (await acceptButton.isVisible().catch(() => false)) {
        await acceptButton.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(TIMEOUTS.COOKIE_BANNER_DELAY);
        continue;
      }
      const allButtons = banner.locator('button');
      const btnCount = await allButtons.count();
      for (let i = 0; i < btnCount; i++) {
        const btn = allButtons.nth(i);
        if (await btn.isVisible().catch(() => false)) {
          await btn.click({ force: true }).catch(() => {});
          await this.page.waitForTimeout(TIMEOUTS.COOKIE_BANNER_DELAY);
        }
      }
      const clickable = banner
        .locator('div[role="button"], span[role="button"], a[role="button"]')
        .first();
      if (await clickable.isVisible().catch(() => false)) {
        await clickable.click({ force: true }).catch(() => {});
        await this.page.waitForTimeout(TIMEOUTS.COOKIE_BANNER_DELAY);
        continue;
      }
      try {
        await banner.click({ force: true, timeout: TIMEOUTS.MODAL_VISIBILITY_TIMEOUT });
        await this.page.waitForTimeout(TIMEOUTS.COOKIE_BANNER_DELAY);
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
    await this.page.evaluate(overlayIds => {
      for (const id of overlayIds) {
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
    }, Array.from(OVERLAY_IDS));
  }

  async preparePage() {
    await this.acceptCookiesIfPresent();
    await this.hideOverlays();
  }
}
