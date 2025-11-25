import { Page, Locator, expect } from '@playwright/test';
import { Fragment, LocatorOrWithOptions } from '@/pages/core';
import { TIMEOUTS } from '@/internal/config/constants';

export class BasePage<T extends Record<string, LocatorOrWithOptions>> extends Fragment<T> {
  constructor(locators: T, page: Page) {
    super(locators, page);
  }

  async open(url: string) {
    await this.page.goto(url, { timeout: TIMEOUTS.NAVIGATION });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async acceptCookiesIfPresent() {
    const cookiePopUp = this.page.locator('[id="cmBannerDescription"]');
    if (await cookiePopUp.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const acceptBtn = cookiePopUp.getByRole('button', { name: /accepteer cookies/i });
      await acceptBtn.click({ force: true, timeout: 8000 });
      await this.page.waitForTimeout(500);
      await cookiePopUp.waitFor({ state: 'hidden', timeout: 5000 });
    }
  }

  async clickAndWaitFor(
    clickTarget: Locator,
    waitTarget: Locator | (() => Promise<unknown>),
    options: { timeout?: number } = {}
  ): Promise<void> {
    const timeout = options.timeout ?? 45000;

    await expect(clickTarget).toBeVisible({ timeout });
    await expect(clickTarget).toBeEnabled({ timeout });

    if (typeof waitTarget === 'function') {
      await Promise.all([
        (async () => {
          const result = await waitTarget();
          return result as unknown;
        })(),
        clickTarget.click(),
      ]);
    } else {
      await Promise.all([waitTarget.waitFor({ timeout }), clickTarget.click()]);
    }
  }
}
