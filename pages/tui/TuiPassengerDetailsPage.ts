import { Page, expect } from '@playwright/test';
import { BasePage } from '@/pages/core';
import { PassengerData } from '@/tests/types/PassengerData';
import { TIMEOUTS, SELECTORS } from '@/internal/config/constants';

const selectors = {
  pageHeading: 'h1',
  submitButton: SELECTORS.SUBMIT_BUTTON,
} as const;

export type PassengerDetailsData = Record<string, Record<string, string>>;

export class TuiPassengerDetailsPage extends BasePage<typeof selectors> {
  private readonly pagePrefix = '/h/nl/book/passengerdetails';

  constructor(page: Page) {
    super(selectors, page);
  }

  async pageLoaded(): Promise<this> {
    await this.page.waitForURL(new RegExp(`.*${this.pagePrefix}.*`), {
      timeout: TIMEOUTS.PAGE_NAVIGATION_TIMEOUT,
      waitUntil: 'domcontentloaded',
    });

    const heading = this.page.locator('h1').filter({ hasText: 'Persoonsgegevens' });
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.PAGE_HEADING_TIMEOUT });

    return this;
  }

  async triggerValidation(): Promise<void> {
    const button = this.locators.submitButton.first();
    await expect(button).toBeVisible();

    await button.click().catch(async () => {
      await button.click({ force: true });
    });

    await this.page.waitForTimeout(TIMEOUTS.COOKIE_BANNER_DELAY);
  }

  async validateRequiredFieldsOnSubmit(): Promise<void> {
    const submitButton = this.page.locator(
      'button[role="button"][aria-label="button"]:has-text("Verder naar betalen")'
    );
    await expect(submitButton).toBeVisible({ timeout: 5_000 });
    await submitButton.click();
    await this.page.waitForTimeout(TIMEOUTS.MODAL_VISIBILITY_TIMEOUT);
    const errors = await this.page
      .locator('.inputs__errorMessage:visible, .inputs__error:visible')
      .all();

    if (errors.length === 0) {
      throw new Error('Expected validation errors for empty required fields, but none were found');
    }

    console.log(`✅ Found ${errors.length} validation error(s) for required fields`);
  }

  async validateField(
    fieldName: keyof PassengerData,
    value: string,
    expectedError: string
  ): Promise<void> {
    switch (fieldName) {
      case 'firstName':
        await this.page.locator('#FIRSTNAMEADULT1').fill(value);
        break;
      case 'lastName':
        await this.page.locator('#SURNAMEADULT1').fill(value);
        break;
      case 'email':
        await this.page.locator('#EMAILADDRESSADULT1').fill(value);
        break;
      case 'phone':
        await this.page.locator('#MOBILENUMBERADULT1').fill(value);
        break;
      case 'dateOfBirth': {
        const parts = value.split(/[-/]/);
        if (parts.length === 3) {
          await this.page.getByRole('textbox', { name: 'day' }).first().fill(parts[0]);
          await this.page.getByRole('textbox', { name: 'month' }).first().fill(parts[1]);
          await this.page.getByRole('textbox', { name: 'year' }).first().fill(parts[2]);
        }
        break;
      }
      case 'passport':
        await this.page
          .locator('#PASSPORTNUMBERADULT1')
          .or(this.page.locator('[id*="PASSPORT"]').first())
          .fill(value)
          .catch(() => {
            console.log('Passport field not available');
          });
        break;
      case 'gender':
        await this.page.locator('#GENDERADULT1').selectOption(value.toUpperCase());
        break;
    }

    await this.page
      .locator('h1')
      .click()
      .catch(() => {});
    await this.page.waitForTimeout(TIMEOUTS.FIELD_VALIDATION_DELAY);

    let fieldSelector: string = '';
    switch (fieldName) {
      case 'firstName':
        fieldSelector = '#FIRSTNAMEADULT1';
        break;
      case 'lastName':
        fieldSelector = '#SURNAMEADULT1';
        break;
      case 'email':
        fieldSelector = '#EMAILADDRESSADULT1';
        break;
      case 'phone':
        fieldSelector = '#MOBILENUMBERADULT1';
        break;
      case 'dateOfBirth':
        fieldSelector = '[name="day"]';
        break;
      case 'passport':
        fieldSelector = '#PASSPORTNUMBERADULT1';
        break;
      case 'gender':
        fieldSelector = '#GENDERADULT1';
        break;
    }

    let errorLocator;
    if (fieldName === 'dateOfBirth') {
      errorLocator = this.page.locator('.inputs__error.inputs__errorMessageWithIcon');
    } else {
      const field = this.page.locator(fieldSelector);
      errorLocator = field
        .locator('..')
        .locator('.inputs__errorMessage:visible, [role="alert"]:visible')
        .first();
    }

    await expect(errorLocator).toBeVisible({ timeout: 5_000 });

    const actualError = await errorLocator.innerText();
    expect(actualError.trim()).toContain(expectedError);
  }

  async clearAllFields(): Promise<void> {
    await this.page.locator('#FIRSTNAMEADULT1').fill('');
    await this.page.locator('#SURNAMEADULT1').fill('');
    await this.page.locator('#EMAILADDRESSADULT1').fill('');
    await this.page.locator('#MOBILENUMBERADULT1').fill('');
    await this.page.getByRole('textbox', { name: 'day' }).first().fill('');
    await this.page.getByRole('textbox', { name: 'month' }).first().fill('');
    await this.page.getByRole('textbox', { name: 'year' }).first().fill('');
  }

  private async fillPassengerForm(data: PassengerData): Promise<void> {
    if (data.gender) {
      await this.page.locator('#GENDERADULT1').selectOption(data.gender.toUpperCase());
    }

    if (data.firstName) {
      await this.page.locator('#FIRSTNAMEADULT1').fill(data.firstName);
    }

    if (data.lastName) {
      await this.page.locator('#SURNAMEADULT1').fill(data.lastName);
    }

    if (data.dateOfBirth) {
      const parts = data.dateOfBirth.split(/[-/]/);
      if (parts.length === 3) {
        await this.page.getByRole('textbox', { name: 'day' }).first().fill(parts[0]);
        await this.page.getByRole('textbox', { name: 'month' }).first().fill(parts[1]);
        await this.page.getByRole('textbox', { name: 'year' }).first().fill(parts[2]);
      }
    }

    if (data.phone) {
      await this.page.locator('#MOBILENUMBERADULT1').fill(data.phone);
    }

    if (data.email) {
      await this.page.locator('#EMAILADDRESSADULT1').fill(data.email);
    }

    if (data.passport) {
      await this.page
        .locator('#PASSPORTNUMBERADULT1')
        .or(this.page.locator('[id*="PASSPORT"]').first())
        .fill(data.passport)
        .catch(() => {
          console.log('Passport field not available');
        });
    }
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
