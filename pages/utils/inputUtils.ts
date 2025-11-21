import { Locator, Page } from '@playwright/test';

export interface InputTypeOptions {
  clear?: boolean;
  submit?: boolean;
}

export class Input {
  constructor(private page: Page) {}

  async typeOneByOne(input: Locator, value: string, options?: InputTypeOptions) {
    if (options?.clear) {
      await this.clear(input);
    }
    await input.pressSequentially(value);
    if (options?.submit) {
      await this.page.keyboard.press('Enter');
    }
  }

  async fill(input: Locator, value: string) {
    await input.fill('');
    await input.fill(value);
  }

  async setFile(input: Locator, filePath: string) {
    await input.setInputFiles(filePath);
  }

  private async clear(selector: Locator) {
    await selector.click({ clickCount: 3 });
    await this.page.keyboard.press('Backspace');
  }
}
