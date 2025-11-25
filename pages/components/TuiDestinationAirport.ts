import { Page, Locator, expect } from '@playwright/test';
import { Component } from '@/pages/core';
import { pickRandom } from '@/pages/utils/random';

const selectors = {
  root: '.dropModalScope_destinations',
  destinationListToggle: "[data-test-id='destination-input']~span",
  destinationListContainer:
    '.dropModalScope_destinations .DestinationsList__destinationListContainer ul',
  destinationsContent: '.dropModalScope_destinations .DropModal__content',
  closeButton: '[aria-label="destinations close"]',
  countriesLinks: '.dropModalScope_destinations .DropModal__content li > a',
  citiesContainer: '.DestinationsList__droplistContainer',
  cityItems: '.DestinationsList__droplistContainer [aria-checked="false"]',
} as const;

export class TuiDestinationAirport extends Component<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async getAvailableOptions(): Promise<Array<{ country: string; cities: string[] }>> {
    await this.openDropdown();
    const countries = await this.getAllAvailableCountries();

    const result: Array<{ country: string; cities: string[] }> = [];

    for (const countryData of countries) {
      await countryData.locator.click();
      await expect(
        countryData.locator,
        `Failed to open cities list for country: ${countryData.name}`
      ).toBeHidden();

      const cities = await this.getAllAvailableCities();

      result.push({
        country: countryData.name,
        cities: cities.map(c => c.name),
      });

      await this.page.goBack();
      await this.page.waitForLoadState('domcontentloaded');
    }

    await this.closeDropdown();
    return result;
  }

  async setDestination(
    countryName?: string,
    cityName?: string
  ): Promise<{
    country: string;
    city: string;
  }> {
    await this.openDropdown();
    const country = await this.selectCountry(countryName);
    const city = await this.selectCity(cityName);

    console.log(`Selected destination country: ${country}`);
    console.log(`Selected destination city/airport: ${city}`);

    return { country, city };
  }

  async openDropdown(): Promise<void> {
    const toggle = this.page
      .locator(selectors.destinationListToggle)
      .getByText('Lijst', { exact: false });

    await expect(toggle).toBeVisible();
    await toggle.click();

    const dropdown = this.page.locator(selectors.destinationListContainer);
    await expect(dropdown).toBeVisible();
  }

  async closeDropdown(): Promise<void> {
    const closeBtn = this.page.locator(selectors.closeButton);

    await closeBtn.click();
    await expect(closeBtn, 'Destination airport dropdown did not close').toBeHidden();
  }

  private async selectCountry(countryName?: string): Promise<string> {
    const availableCountries = await this.getAllAvailableCountries();
    let selected: { locator: Locator; name: string };

    if (countryName) {
      const found = availableCountries.find(c => c.name.includes(countryName));
      if (!found) {
        throw new Error(`Country with name "${countryName}" not found among available options`);
      }
      selected = found;
    } else {
      selected = pickRandom(availableCountries);
    }

    await selected.locator.click();
    await expect(
      selected.locator,
      `Failed to select destination country: ${selected.name}`
    ).toBeHidden();

    return selected.name;
  }

  private async getAllAvailableCountries(): Promise<Array<{ locator: Locator; name: string }>> {
    const listRoot = this.page.locator(selectors.destinationsContent);

    await expect(listRoot).toBeVisible();
    const items = await listRoot.locator('li > a').all();

    const result: Array<{ locator: Locator; name: string }> = [];

    for (const item of items) {
      await expect(item).toBeVisible();
      const className = (await item.getAttribute('class')) || '';
      const text = (await item.innerText()).trim();

      if (!className.includes('disabled') && text) {
        result.push({ locator: item, name: text });
      }
    }

    if (!result.length) {
      throw new Error('No available destination countries found');
    }

    return result;
  }

  private async getAllAvailableCities(): Promise<Array<{ locator: Locator; name: string }>> {
    const area = this.page.locator(selectors.citiesContainer);

    await expect(area).toBeVisible({ timeout: 10_000 });

    const allItems = await area
      .locator(
        'li, [role="option"], [aria-checked], a, .DestinationsList__droplistContainer [data-test-id]'
      )
      .all();

    const cities: Array<{ locator: Locator; name: string }> = [];

    for (const item of allItems) {
      try {
        await expect(item).toBeVisible({ timeout: 2_000 });
      } catch {
        continue;
      }
      const className = (await item.getAttribute('class')) || '';
      if (className.includes('disabled')) continue;
      const text = (await item.innerText()).trim();
      if (text) {
        cities.push({ locator: item, name: text });
      }
    }

    if (!cities.length) {
      throw new Error('No available destination cities/airports found');
    }

    return cities;
  }

  private async selectCity(cityName?: string): Promise<string> {
    const cities = await this.getAllAvailableCities();

    let selected: { locator: Locator; name: string };

    if (cityName) {
      const found = cities.find(c => c.name.includes(cityName));
      if (!found) {
        throw new Error(`City with name "${cityName}" not found among available options`);
      }
      selected = found;
    } else {
      selected = pickRandom(cities);
    }

    await selected.locator.click();

    return selected.name;
  }
}
