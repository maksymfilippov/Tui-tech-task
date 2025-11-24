import { TestType } from '@playwright/test';

export const decorateMethodsWithSteps = <T extends object>(
  pageInstance: T,
  test: TestType<object, object>
): void => {
  const pageName = pageInstance.constructor.name;

  const propertyOwner = Object.getPrototypeOf(pageInstance);
  const parentPropertyOwner = Object.getPrototypeOf(propertyOwner);

  const properties = Object.getOwnPropertyNames(propertyOwner);
  const parentProperties = Object.getOwnPropertyNames(parentPropertyOwner);

  const methods = Array.from(new Set([...parentProperties, ...properties]));

  const methodNames = methods.filter(method => {
    const prop = (pageInstance as Record<string, unknown>)[method];
    return (
      prop &&
      typeof prop === 'function' &&
      prop.constructor.name === 'AsyncFunction' &&
      method !== 'constructor'
    );
  });

  for (const methodName of methodNames) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = pageInstance as any;
    const originalMethod = instance[methodName];

    instance[methodName] = async function (...args: unknown[]) {
      return test.step(`${pageName}.${methodName}`, () => originalMethod.apply(pageInstance, args));
    };
  }
};
