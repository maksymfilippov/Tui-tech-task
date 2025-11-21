import { Page, Locator, expect } from '@playwright/test';
import { Component } from '@/pages/core';
import { pickRandom } from '@/pages/utils/random';

const selectors = {
  root: '.UI__choiceSearchPanel',
  departureInput:
    '.UI__choiceSearchPanel input[name="Departure Airport"], input.SelectAirports__pointer',
  airportsContainer: '.SelectAirports__droplistContainer',
  airportCheckboxes: '.SelectAirports__droplistContainer [role="checkbox"]',
} as const;

export class TuiDepartureAirport extends Component<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async selectDepartureAirport(name?: string): Promise<string> {
    await this.openDropdown();
    const available = await this.getAllAvailableDepartureAirports();

    let selected: { locator: Locator; name: string } | undefined;
    if (name) {
      selected = available.find(a => a.name.includes(name));
      if (!selected) {
        throw new Error(`Airport with name "${name}" not found among available options`);
      }
    } else {
      selected = pickRandom(available);
    }

    await selected.locator.click();
    console.log(`Selected departure airport: ${selected.name}`);

    return selected.name;
  }

  private async openDropdown(): Promise<void> {
    const input = this.page.locator(selectors.departureInput).first();
    await expect(input).toBeVisible();
    await input.click();

    const container = this.page.locator(selectors.airportsContainer);
    await expect(container).toBeVisible();
  }

  private async getAllAvailableDepartureAirports(): Promise<
    Array<{ locator: Locator; name: string }>
  > {
    const result: Array<{ locator: Locator; name: string }> = [];
    const container = this.page.locator(selectors.airportsContainer);

    await expect(container).toBeVisible();

    const allAirports = await container
      .locator(
        'li, [role="checkbox"], [role="option"], [data-test-id*="airport"], .SelectAirports__airportListItem'
      )
      .all();

    for (const airport of allAirports) {
      const input = airport.locator('input');
      const isDisabled = await input.isDisabled().catch(() => false);
      const text = (await airport.innerText()).trim();

      if (!isDisabled && text) {
        result.push({ locator: airport, name: text });
      }
    }

    if (!result.length) {
      throw new Error('No available departure airports found');
    }

    return result;
  }
}
