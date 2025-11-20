import { Locator, Page } from '@playwright/test';

export interface LocatorOptions {
	value: string;
	has?: Locator;
	hasText?: string | RegExp;
}

export type LocatorOrWithOptions = string | LocatorOptions;

export type PageLocators<T> = Record<keyof T, Locator>;

export const objectToLocator = <T>(page: Page, locators: T) =>
	Object.keys(locators as Record<string, string>).reduce((locs, key) => {
		const locatorName = key as keyof typeof locators;
		const locatorArgument = locators[locatorName] as LocatorOrWithOptions;

		if (typeof locatorArgument === 'string') {
			locs[locatorName] = page.locator(locatorArgument);
		}

		if (typeof locatorArgument === 'object' && locatorArgument.value) {
			locs[locatorName] = page.locator(locatorArgument.value, locatorArgument);
		}

		return locs;
	}, {} as PageLocators<T>);
