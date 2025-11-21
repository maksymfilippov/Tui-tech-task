import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';

const selectors = {
  pageHeading: 'h1',
  submitButton:
    'button:has-text("Continue"), button:has-text("Ga verder"), button:has-text("Doorgaan"), button[type="submit"], .ProgressbarNavigation__summaryButton button',
} as const;

export type PassengerDetailsData = Record<string, Record<string, string>>;

export class TuiPassengerDetailsPage extends BasePage<typeof selectors> {
  private readonly pagePrefix = '/h/nl/book/passengerdetails';

  constructor(page: Page) {
    super(selectors, page);
  }

  async pageLoaded(): Promise<this> {
    await this.acceptCookiesIfPresent().catch(() => {});

    await this.page.waitForURL(new RegExp(`.*${this.pagePrefix}.*`), {
      timeout: 40_000,
      waitUntil: 'domcontentloaded',
    });

    const heading = this.page
      .locator('h1')
      .filter({ hasText: /Persoonsgegevens|Passenger details/i });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    return this;
  }

  async triggerValidation(): Promise<void> {
    await this.page.waitForTimeout(1000);
    const button = this.locators.submitButton.first();
    await expect(button).toBeVisible({ timeout: 10_000 });

    await button.click().catch(async () => {
      await button.click({ force: true });
    });

    await this.page.waitForTimeout(500);
  }

  async personalDetailsValidating(
    objectToCheck: PassengerDetailsData,
    expectedErrorText?: string
  ): Promise<void> {
    const pageHeadingLocator = this.page.locator('[aria-label="page heading"]');

    for (const [passengerKey, fields] of Object.entries(objectToCheck)) {
      for (const [fieldName, value] of Object.entries(fields)) {
        const inputLocator = this.inputLocatorBuilder(passengerKey, fieldName);

        await expect(inputLocator).toBeVisible({ timeout: 10_000 });

        console.log(`Validating ${passengerKey}.${fieldName} with value: "${value}"`);

        if (fieldName.toLowerCase() === 'gender') {
          await inputLocator.selectOption(value).catch(async () => {
            const option = this.page.getByText(value, { exact: true }).first();
            await option.click();
          });
        } else {
          await inputLocator.fill(value);
        }

        await pageHeadingLocator.click().catch(() => {});

        const errorLocator = this.getErrorMessageLocator(passengerKey, fieldName);
        await expect(errorLocator).toBeVisible({ timeout: 8_000 });

        if (expectedErrorText) {
          const actualErrorText = await errorLocator.innerText();
          expect(actualErrorText.trim()).toEqual(expectedErrorText);
          console.log(`Expected error: "${expectedErrorText}"`);
          console.log(`Actual error: "${actualErrorText.trim()}"`);
        } else {
          const actualErrorText = await errorLocator.innerText();
          console.log(`Error displayed: "${actualErrorText.trim()}"`);
        }
      }
    }
  }

  private inputLocatorBuilder(passengerKey: string, fieldName: string) {
    const fieldUpper = fieldName.toUpperCase();
    const passengerUpper = passengerKey.toUpperCase();

    const passengerType = passengerUpper.replace(/\d+$/, '');

    const exactId = `[id="${fieldUpper}${passengerUpper}"]`;
    const exactName = `[name="${fieldUpper}${passengerUpper}"]`;

    const generalPattern = `input[name*="${fieldUpper}"]:not([type="hidden"]):visible`;

    return this.page.locator(`${exactId}, ${exactName}, ${generalPattern}`).first();
  }

  private getErrorMessageLocator(passengerKey: string, fieldName: string) {
    const fieldUpper = fieldName.toUpperCase();
    const passengerUpper = passengerKey.toUpperCase();

    const errorId = `[id="${fieldUpper}${passengerUpper}__errorMessage"]:not(.inputs__hidden)`;

    const visibleError =
      '.inputs__errorMessage:not(.inputs__hidden), [role="alert"]:not(.inputs__hidden)';

    return this.page.locator(`${errorId}, ${visibleError}`).first();
  }
}
