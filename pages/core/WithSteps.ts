import { test } from '@playwright/test';
import { decorateMethodsWithSteps } from '@/pages/utils/stepDecorator';

export abstract class WithEachFunctionAsStep {
  constructor() {
    this.registerSteps(this);
  }

  private registerSteps(instance: object) {
    decorateMethodsWithSteps(instance, test);
  }
}
