import { Page, Locator, expect } from '@playwright/test';
import { Component } from '@/pages/core';
import { getRandomInt } from '@/pages/utils/random';

const selectors = {
  root: '.dropModalScope_roomandguest',
  dropdownInput: '[data-test-id="rooms-and-guest-input"]',
  dropdownContent: '.dropModalScope_roomandguest',
  adultsSelector: '.AdultSelector__adultSelector select',
  childrenSelector: '.ChildrenSelector__childrenSelector select',
  childAgeSelector: '.ChildrenAge__childAgeSelector select',
  saveButton: 'button.DropModal__apply',
} as const;

interface GuestConfiguration {
  adults?: number;
  childrenAges?: number[];
}

export class TuiRoomsAndGuests extends Component<typeof selectors> {
  constructor(page: Page) {
    super(selectors, page);
  }

  async openTravelersDropdown(): Promise<void> {
    const dropdownInput = this.page.locator(selectors.dropdownInput);
    await dropdownInput.click();

    const dropdownContent = this.page.locator(selectors.dropdownContent);
    await expect(dropdownContent).toBeVisible({ timeout: 10_000 });
  }

  async selectAdultsCount(adultsCount: number = 2): Promise<void> {
    const adultsSelector = this.page.locator(selectors.adultsSelector);
    await expect(adultsSelector).toBeVisible({ timeout: 5_000 });
    await adultsSelector.selectOption({ label: adultsCount.toString() });
  }

  async selectChildrenCount(childrenAges: number[]): Promise<void> {
    if (childrenAges.length === 0) {
      childrenAges = [getRandomInt(0, 17)];
    }

    const childrenSelector = this.page.locator(selectors.childrenSelector);
    await expect(childrenSelector).toBeVisible({ timeout: 5_000 });
    await childrenSelector.selectOption({ label: childrenAges.length.toString() });

    await this.page.waitForTimeout(500);

    const childAgeSelectors = await this.page.locator(selectors.childAgeSelector).all();

    for (let i = 0; i < childrenAges.length; i++) {
      await childAgeSelectors[i].selectOption({ label: childrenAges[i].toString() });
    }
  }

  async selectTravelers(adultsCount: number, childrenAges?: number[]): Promise<void> {
    await this.openTravelersDropdown();
    await this.selectAdultsCount(adultsCount);

    if (childrenAges && childrenAges.length > 0) {
      await this.selectChildrenCount(childrenAges);
    }

    await this.closeDropdown();
  }

  async setTwoAdultsWithRandomChild(): Promise<number> {
    const randomAge = getRandomInt(2, 15);

    await this.openTravelersDropdown();
    await this.selectAdultsCount(2);
    await this.selectChildrenCount([randomAge]);
    await this.closeDropdown();

    console.log(`Guests selected: 2 adults, 1 child (age ${randomAge})`);
    return randomAge;
  }

  private async closeDropdown(): Promise<void> {
    const dropdownContent = this.page.locator(selectors.dropdownContent);
    const saveButton = dropdownContent.locator(selectors.saveButton).first();

    await expect(saveButton).toBeVisible({ timeout: 5_000 });
    await saveButton.click();
    await expect(dropdownContent).toBeHidden({ timeout: 10_000 });
  }
}
