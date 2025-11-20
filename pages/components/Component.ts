import { Page } from '@playwright/test';
import { Fragment, Input } from '@/pages/fragments';

export interface Components {
	input: Input;
}

export class Component<T> extends Fragment<T> {
	public components: Components;

	constructor(locators: T, page: Page) {
		super(locators, page);

		this.components = {
			input: new Input(page),
		};
	}
}
