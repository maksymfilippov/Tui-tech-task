import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import {
  TuiDepartureAirport,
  TuiDestinationAirport,
  TuiDepartureDate,
  TuiRoomsAndGuests,
} from '@/pages/components';
import { PASSENGER, TIMEOUTS, SELECTORS, TEXT_PATTERNS } from '@/internal/config/constants';

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
        } else {
          throw error;
        }
      }
    }
  }

  async setRoomsAndGuestsTwoAdultsOneChild(): Promise<number> {
    await this.ensureReady();

    const candidateSelectors = [
      selectors.roomsGuestsButton,
      'button:has-text("Reiziger")',
      'button:has-text("Reizigers")',
      'button:has-text("Passengers")',
      '[data-test-id*="rooms"]',
      '[data-test-id*="passengers"]',
      'section[aria-label*="room"]',
      'section[aria-label*="passengers"]',
    ];

    let clicked = false;
    for (const sel of candidateSelectors) {
      const loc = this.page.locator(sel).first();
      if ((await loc.count()) && (await loc.isVisible().catch(() => false))) {
        await loc.click().catch(() => {});
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      throw new Error('Rooms/guests trigger not visible');
    }

    const region = this.page.getByRole('region', {
      name: TEXT_PATTERNS.ROOMS_GUESTS,
    });
    await expect(region).toBeVisible({ timeout: 10_000 });

    let modalRoot = region;
    const candidateModal = this.page
      .locator(
        '.DropModal__dropModalContent, .dropModalScope_roomandguest, .DropModal__contentAlign'
      )
      .filter({ hasText: TEXT_PATTERNS.ADULTS })
      .first();
    if ((await candidateModal.count()) && (await candidateModal.isVisible().catch(() => false))) {
      modalRoot = candidateModal;
    }

    let adultsRow = modalRoot
      .locator('div, li')
      .filter({ hasText: /Volwassenen|Adults|Adulten|Volwassen/i })
      .first();
    if ((await adultsRow.count()) === 0) {
      adultsRow = modalRoot
        .locator('div, li')
        .filter({ hasText: /Volwassenen|Adults|Adulten|Volwassen/i })
        .first();
    }
    if ((await adultsRow.count()) === 0) {
      adultsRow = modalRoot
        .locator('div, li')
        .filter({ has: modalRoot.getByRole('button') })
        .first();
    }

    const adultsRowTextRaw = (await adultsRow.textContent().catch(() => '')) || '';
    const adultsRowText = adultsRowTextRaw.replace(/\s+/g, ' ').trim();

    const compact = adultsRowText.replace(/\s+/g, '');
    if (/Volwassenen.*2/i.test(compact) || /Adults.*2/i.test(compact)) {
      return 2;
    }

    const adultsInput = adultsRow
      .locator('input[type="number"], input[aria-label*="adult"], input[data-test-id*="adults"]')
      .first();
    if (await adultsInput.count()) {
      try {
        await expect(adultsInput).toBeVisible({ timeout: 2_000 });
        await adultsInput.fill('2');
        const val = await adultsInput.inputValue().catch(() => '');
        if (val !== '2') {
          await this.page.waitForTimeout(TIMEOUTS.DROPDOWN_OPEN_DELAY);
        }
      } catch {}
    }

    let plusBtn = adultsRow.getByRole('button').filter({ hasText: /\+/ }).first();
    let minusBtn = adultsRow.getByRole('button').filter({ hasText: /−|-|–/ }).first();

    const buttonsCount = await adultsRow.getByRole('button').count();
    if (buttonsCount > 0 && (await plusBtn.count()) === 0) {
      if (buttonsCount >= 2) {
        minusBtn = adultsRow.getByRole('button').nth(0);
        plusBtn = adultsRow.getByRole('button').nth(buttonsCount - 1);
      } else {
        plusBtn = adultsRow.getByRole('button').nth(0);
      }
    }

    const clickWithRetries = async (locator: import('@playwright/test').Locator, attempts = 3) => {
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          if (await locator.isVisible().catch(() => false)) {
            await locator.click().catch(async () => {
              await locator.click({ force: true }).catch(() => {});
            });
            return true;
          }
        } catch (err) {
          if (String(err).includes('Target page, context or browser has been closed')) throw err;
        }
        await this.page.waitForTimeout(TIMEOUTS.RETRY_BASE_DELAY + attempt * 100);
      }
      return false;
    };

    if (minusBtn && (await minusBtn.count())) {
      for (let i = 0; i < 3; i++) {
        await clickWithRetries(minusBtn).catch(() => {});
      }
    }

    let success = false;

    if (!(plusBtn && (await plusBtn.count()))) {
      const numberTwo = modalRoot.getByText(/\b2\b/).first();
      if ((await numberTwo.count()) && (await numberTwo.isVisible().catch(() => false))) {
        await numberTwo.click({ force: true }).catch(() => {});
        if (await adultsInput.count()) {
          const v = await adultsInput.inputValue().catch(() => '');
          if (v === '2') {
            success = true;
          }
        } else {
          const rawNow = (await modalRoot.textContent().catch(() => '')) || '';
          if (/\b2\b/.test(rawNow)) success = true;
        }
      } else {
        const anyTwo = modalRoot
          .locator('button, a, span, li')
          .filter({ hasText: /\b2\b/ })
          .first();
        if ((await anyTwo.count()) && (await anyTwo.isVisible().catch(() => false))) {
          await anyTwo.click({ force: true }).catch(() => {});
          const rawNow = (await modalRoot.textContent().catch(() => '')) || '';
          if (/\b2\b/.test(rawNow)) success = true;
        }
      }
    }

    let attempts = 0;
    const maxAttempts = 6;
    while (attempts < maxAttempts) {
      attempts++;
      await clickWithRetries(plusBtn).catch(() => {});
      if (await adultsInput.count()) {
        const v = await adultsInput.inputValue().catch(() => '');
        if (v === '2') {
          success = true;
          break;
        }
      }
      const raw = (await adultsRow.textContent().catch(() => '')) || '';
      const textNow = raw.replace(/\s+/g, ' ').trim();
      if (/\b2\b/.test(textNow)) {
        success = true;
        break;
      }
      await this.page.waitForTimeout(TIMEOUTS.DROPDOWN_OPEN_DELAY);
    }

    if (!success) {
      const numberTwo = modalRoot.getByText(/\b2\b/).first();
      if ((await numberTwo.count()) && (await numberTwo.isVisible().catch(() => false))) {
        await numberTwo.click({ force: true }).catch(() => {});
        if (await adultsInput.count()) {
          const v = await adultsInput.inputValue().catch(() => '');
          if (v === '2') {
            success = true;
          }
        } else {
          const rawNow = (await modalRoot.textContent().catch(() => '')) || '';
          if (/\b2\b/.test(rawNow)) success = true;
        }
      }
    }

    if (!success) {
      throw new Error('Failed to increment adults count');
    }

    const childrenRow = region
      .locator('div, li')
      .filter({ hasText: /Kinderen/i })
      .first();

    const childrenPlus = childrenRow.getByRole('button').filter({ hasText: /\+/ }).first();

    await childrenPlus.click();

    const ageSelect = region.locator('select, [data-test-id*="child-age"]').first();

    await expect(ageSelect).toBeVisible({ timeout: 10_000 });

    // Generate random child age (2-15 years) - TUI.nl accepts children ages from 2 to 15
    const randomAge =
      PASSENGER.MIN_CHILD_AGE +
      Math.floor(Math.random() * (PASSENGER.MAX_CHILD_AGE - PASSENGER.MIN_CHILD_AGE - 1));
    await ageSelect.selectOption(String(randomAge)).catch(async () => {
      const option = region.getByText(String(randomAge), { exact: true }).first();
      await option.click();
    });

    const saveButton = region.getByRole('button', { name: /Opslaan/i }).first();

    await saveButton.click();
    await expect(region).toBeHidden({ timeout: 10_000 });

    console.log('\n[TUI] Guests selected (child age)\n' + randomAge);
    return randomAge;
  }

  async setRoomsAndGuestsTwoAdultsOneChildRefactored(): Promise<number> {
    await this.ensureReady();
    const childAge = await this.roomsAndGuests.setTwoAdultsWithRandomChild();
    console.log(`\n[TUI] Guests configured\n2 adults, 1 child (age ${childAge})`);
    return childAge;
  }

  async search(): Promise<void> {
    const button = this.page.locator(selectors.searchButton).first();

    await expect(button).toBeVisible({ timeout: 10_000 });
    await button.click();

    console.log('[TUI] Search triggered');
  }
}
