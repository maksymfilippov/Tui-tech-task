import { Locator, Page } from '@playwright/test';

export interface LocatorOptions {
  value: string;
  has?: Locator;
  hasText?: string | RegExp;
}

export type LocatorOrWithOptions = string | Locator | LocatorOptions;

export type PageLocators<T> = Record<keyof T, Locator>;

export const objectToLocator = <T extends Record<string, LocatorOrWithOptions>>(
  page: Page,
  locators: T
) =>
  Object.keys(locators).reduce((locs, key) => {
    const locatorName = key as keyof T;
    const locatorArgument = locators[locatorName];

    if (typeof locatorArgument === 'string') {
      locs[locatorName] = page.locator(locatorArgument);
    } else if (locatorArgument && typeof locatorArgument === 'object') {
      if ('count' in locatorArgument) {
        locs[locatorName] = locatorArgument as Locator;
      } else if ('value' in locatorArgument) {
        locs[locatorName] = page.locator(locatorArgument.value, locatorArgument);
      }
    }

    return locs;
  }, {} as PageLocators<T>);
