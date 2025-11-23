import { Page, Locator } from '@playwright/test';
import { objectToLocator, PageLocators, LocatorOrWithOptions } from './objectToLocator';
import { WithEachFunctionAsStep } from './WithSteps';

export type { LocatorOrWithOptions };

export class Fragment<
  T extends Record<string, LocatorOrWithOptions>,
> extends WithEachFunctionAsStep {
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
    const locatorValue = this.$[child];
    if (typeof locatorValue === 'string') {
      return parent.locator(locatorValue);
    } else if (locatorValue && typeof locatorValue === 'object' && 'value' in locatorValue) {
      return parent.locator(locatorValue.value, locatorValue);
    }
    throw new Error(`Cannot find within: invalid locator type for ${String(child)}`);
  }

  async exists(element: Locator) {
    const count = await element.count();
    return count > 0;
  }
}
