import { Page, Locator } from '@playwright/test';
import { Fragment } from './Fragment';

export class Component<T extends { root: string }> extends Fragment<T> {
  protected root: Locator;

  constructor(locators: T, page: Page) {
    super(locators, page);
    this.root = this.locators.root as Locator;
  }

  async click(key: keyof T): Promise<void> {
    await this.locators[key].click();
  }

  async fill(key: keyof T, value: string): Promise<void> {
    await this.locators[key].fill(value);
  }

  async selectOption(key: keyof T, option: string | { label: string }): Promise<void> {
    await this.locators[key].selectOption(option);
  }

  async getText(key: keyof T): Promise<string> {
    return (await this.locators[key].textContent()) || '';
  }

  async getValue(key: keyof T): Promise<string> {
    return await this.locators[key].inputValue();
  }

  async waitVisible(key?: keyof T): Promise<void> {
    const target = key ? this.locators[key] : this.root;
    await target.waitFor({ state: 'visible' });
  }

  async waitHidden(key?: keyof T): Promise<void> {
    const target = key ? this.locators[key] : this.root;
    await target.waitFor({ state: 'hidden' });
  }

  async isVisible(key: keyof T): Promise<boolean> {
    return await this.locators[key].isVisible();
  }

  async isHidden(key: keyof T): Promise<boolean> {
    return await this.locators[key].isHidden();
  }

  async isEnabled(key: keyof T): Promise<boolean> {
    return await this.locators[key].isEnabled();
  }

  async getAttribute(key: keyof T, name: string): Promise<string | null> {
    return await this.locators[key].getAttribute(name);
  }

  async getAll(key: keyof T): Promise<Locator[]> {
    return await this.locators[key].all();
  }

  async count(key: keyof T): Promise<number> {
    return await this.locators[key].count();
  }
}
