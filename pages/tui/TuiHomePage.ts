import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/utils/BasePage';
import {
  TuiDepartureAirport,
  TuiDestinationAirport,
  TuiDepartureDate,
  TuiRoomsAndGuests,
} from '@/pages/components';

const selectors = {
  departureInput: 'input.SelectAirports__pointer',
  destinationInput:
    '[data-test-id="destination-input"], input[placeholder*="Destination"], input[placeholder*="Hotel"], input[placeholder*="Bestemming"]',

  roomsGuestsButton:
    '[aria-label="room and guest"], [aria-label*="Reiziger"], button:has-text("Reiziger"), button:has-text("Reizigers")',

  searchButton:
    'button:has-text("ZOEKEN"), button:has-text("Zoeken"), button:has-text("Search")',
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
    const banner = this.page.locator('#cmNotifyBanner, #__tealiumGDPRecModal');
    if (!(await banner.isVisible().catch(() => false))) return;

    const button = banner
      .getByRole('button')
      .filter({
        hasText: /Akkoord|Accepteer|Accepteren|Alles accepteren|Accept/i,
      })
      .first();

    try {
      if (await button.isVisible({ timeout: 2_000 })) {
        await button.click();
        await banner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
        console.log('Cookies banner accepted');
      }
    } catch {
    }
  }

  async ensureReady(): Promise<void> {
  await this.acceptCookiesIfPresent();
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
      if (await loc.count() && (await loc.isVisible().catch(() => false))) {
        await loc.click().catch(() => {});
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      throw new Error('Rooms/guests trigger not visible');
    }

    const region = this.page.getByRole('region', {
      name: /room and guest|passengers|Reiziger|Reizigers/i,
    });
    await expect(region).toBeVisible({ timeout: 10_000 });

    let modalRoot = region;
    const candidateModal = this.page
      .locator('.DropModal__dropModalContent, .dropModalScope_roomandguest, .DropModal__contentAlign')
      .filter({ hasText: /Volwassenen|Adults|Reiziger|Reizigers/i })
      .first();
    if ((await candidateModal.count()) && (await candidateModal.isVisible().catch(() => false))) {
      modalRoot = candidateModal;
    }

    let adultsRow = modalRoot.locator('div, li').filter({ hasText: /Volwassenen|Adults|Adulten|Volwassen/i }).first();
    if ((await adultsRow.count()) === 0) {
      adultsRow = modalRoot.locator('div, li').filter({ hasText: /Volwassenen|Adults|Adulten|Volwassen/i }).first();
    }
    if ((await adultsRow.count()) === 0) {
      adultsRow = modalRoot.locator('div, li').filter({ has: modalRoot.getByRole('button') }).first();
    }

    const adultsRowTextRaw = (await adultsRow.textContent().catch(() => '')) || '';
    const adultsRowText = adultsRowTextRaw.replace(/\s+/g, ' ').trim();
    const foundButtonsCount = await adultsRow.getByRole('button').count().catch(() => 0);

    const compact = adultsRowText.replace(/\s+/g, '');
    if (/Volwassenen.*2/i.test(compact) || /Adults.*2/i.test(compact)) {
      return 2;
    }

    const adultsInput = adultsRow.locator('input[type="number"], input[aria-label*="adult"], input[data-test-id*="adults"]').first();
    if (await adultsInput.count()) {
      try {
        await expect(adultsInput).toBeVisible({ timeout: 2_000 });
        await adultsInput.fill('2');
        const val = await adultsInput.inputValue().catch(() => '');
        if (val === '2') {
        } else {
          await this.page.waitForTimeout(200);
        }
      } catch {
      }
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
        await this.page.waitForTimeout(150 + attempt * 100);
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
        const anyTwo = modalRoot.locator('button, a, span, li').filter({ hasText: /\b2\b/ }).first();
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
      await this.page.waitForTimeout(200);
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

    const childrenPlus = childrenRow
      .getByRole('button')
      .filter({ hasText: /\+/ })
      .first();

    await childrenPlus.click();

    const ageSelect = region.locator('select, [data-test-id*="child-age"]').first();

    await expect(ageSelect).toBeVisible({ timeout: 10_000 });

    const randomAge = 2 + Math.floor(Math.random() * 14);
    await ageSelect.selectOption(String(randomAge)).catch(async () => {
      const option = region.getByText(String(randomAge), { exact: true }).first();
      await option.click();
    });

    const saveButton = region
      .getByRole('button', { name: /Opslaan/i })
      .first();

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
