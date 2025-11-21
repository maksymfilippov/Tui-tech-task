import { Page, Locator } from '@playwright/test';
import { objectToLocator, PageLocators } from './objectToLocator';
import { WithEachFunctionAsStep } from './WithSteps';

export class Fragment<T> extends WithEachFunctionAsStep {
  public page: Page;
  public $: T;
  public locators: PageLocators<T>;

  constructor(locators: T, page: Page) {
    super();
    this.page = page;
    this.$ = locators;
    this.locators = objectToLocator(page, locators);
  }

  findWithin(parent: Locator, child: keyof T) {
    return parent.locator(this.$[child] as string);
  }

  async isExisting(element: Locator) {
    const count = await element.count();
    return count > 0;
  }
}
