import { Page, Locator, expect } from '@playwright/test';
import { Component } from '@/pages/core';

const selectors = {
  root: '.DropModal__dropModalContent.dropModalScope_Departuredate',
  departureDateInput: '[data-test-id="departure-date-input"]',
  modalContent: '.DropModal__dropModalContent.dropModalScope_Departuredate',
  monthSelector: '.dropModalScope_Departuredate .SelectLegacyDate__monthSelector',
  toleranceArea: '.SelectLegacyDate__flexibilityOnly',
  calendarRoot: '.SelectLegacyDate__calendar',
  availableDay: 'td.SelectLegacyDate__available',
  closeButton: '[aria-label="Departure date close"]',
} as const;

type DayTolerance = '0' | '3' | '7' | '14';

function pickRandom<T>(items: T[]): T {
  if (!items.length) {
    throw new Error('Cannot pick random element from empty array');
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export class TuiDepartureDate extends Component<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async setDepartureDate(daysTolerance: DayTolerance): Promise<string> {
    await this.openDatePicker();
    await this.setTolerance(daysTolerance);
    const chosenDate = await this.pickRandomAvailableDate();
    return chosenDate;
  }

  async isMonthAvailable(): Promise<boolean> {
    await this.openDatePicker();

    const monthSelector = this.page
      .locator(selectors.monthSelector)
      .filter({ hasText: 'EERDER VERTREKKEN' });

    const available = await monthSelector.isVisible({ timeout: 2_000 }).catch(() => false);

    await this.closeDatePicker();
    return available;
  }

  private async openDatePicker(): Promise<void> {
    const input = this.page.locator(selectors.departureDateInput);

    await expect(input).toBeVisible();
    await input.click();

    const modal = this.page.locator(selectors.modalContent);
    await expect(modal).toBeVisible();
  }

  private async closeDatePicker(): Promise<void> {
    const closeBtn = this.page.locator(selectors.closeButton);

    await closeBtn.click();
    await expect(closeBtn, 'Departure date picker did not close').toBeHidden();
  }

  private async setTolerance(daysTolerance: DayTolerance): Promise<void> {
    const area = this.page.locator(selectors.toleranceArea);

    await expect(area).toBeVisible();

    let label: string;

    switch (daysTolerance) {
      case '0':
        label = 'Niet flexibel';
        break;
      case '3':
        label = '+/- 3 dagen';
        break;
      case '7':
        label = '+/- 7 dagen';
        break;
      case '14':
        label = '+/- 14 dagen';
        break;
      default:
        label = 'Niet flexibel';
        break;
    }

    const option = area.locator('li').getByText(label, { exact: true });
    await option.click();

    const radioInput = area.locator(`li input[aria-label="${label}"]`);
    const isChecked = await radioInput.isChecked();

    expect(isChecked, `Failed to select date tolerance: ${label}`).toBeTruthy();
  }

  private async pickRandomAvailableDate(): Promise<string> {
    const calendarCandidates = [
      selectors.calendarRoot,
      '.datepicker',
      '.DayPicker',
      '.Calendar',
      '.SelectLegacyDate__calendar',
    ];

    const daySelectors = [
      selectors.availableDay,
      'td[aria-disabled="false"] button, td[role="button"]',
      'button[data-day]',
      'td:not(.disabled) button, td:not(.disabled) .day',
    ];

    let calendar: Locator | null = null;
    for (const root of calendarCandidates) {
      const loc = this.page.locator(root).first();
      if ((await loc.count()) && (await loc.isVisible().catch(() => false))) {
        calendar = loc;
        break;
      }
    }

    if (!calendar) {
      throw new Error('Calendar root not found');
    }

    let availableCells: Locator[] = [];
    for (const s of daySelectors) {
      const elems = await calendar.locator(s).all();
      if (elems.length) {
        availableCells = elems;
        break;
      }
    }

    if (!availableCells.length) {
      const fallback = await calendar.locator('button, td[role="button"], a').all();
      if (fallback.length) availableCells = fallback as Locator[];
    }

    if (!availableCells.length) {
      try {
        const numeric = await calendar
          .locator('button, td, span, a, div')
          .filter({ hasText: /^\s*\d{1,2}\s*$/ })
          .all();
        if (numeric.length) availableCells = numeric as Locator[];
      } catch {}
    }

    if (!availableCells.length) {
      throw new Error('No available dates found');
    }

    const withText: Array<{ locator: Locator; date: string }> = [];
    for (const cell of availableCells) {
      try {
        await expect(cell).toBeVisible({ timeout: 1000 });
      } catch {
        continue;
      }
      const text = (await cell.innerText()).trim();
      if (text) withText.push({ locator: cell, date: text });
    }

    if (!withText.length) {
      throw new Error('No available dates with text found');
    }

    const selected = pickRandom(withText);
    await selected.locator.click();

    console.log(`Selected departure date: ${selected.date}`);
    return selected.date;
  }
}
