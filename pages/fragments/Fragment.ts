import { test, Page, Locator } from '@playwright/test';
import { objectToLocator, PageLocators } from '@/pages/utils/objectToLocator';
import { NetworkCounter, WaitForIdleOptions } from '@/pages/utils/requestsCounter';
import { WithEachFunctionAsStep } from './WithSteps';

export class Fragment<T> extends WithEachFunctionAsStep {
	public page: Page;
	public $: T;
	public locators: PageLocators<T>;
	private readonly network: NetworkCounter;

	constructor(locators: T, page: Page) {
		super();
		this.page = page;
		this.$ = locators;
		this.locators = objectToLocator(page, locators);

		this.network = new NetworkCounter(page);
	}

	async waitNetworkIdle(options?: WaitForIdleOptions) {
		const { elapsed, count } = await this.network.isIdle(options);
		await test.step(`elapsed: ${elapsed} ms, finished ${count} request(s)`, async () => {
			await this.page.waitForLoadState('domcontentloaded');
		});
	}

	findWithin(parent: Locator, child: keyof T) {
		return parent.locator(this.$[child] as string);
	}

	async isExisting(element: Locator) {
		const count = await element.count();
		return count > 0;
	}
}
