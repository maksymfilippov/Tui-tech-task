import { TestType } from '@playwright/test';

export const decorateMethodsWithSteps = <T extends object>(
  pageInstance: T,
  test: TestType<any, any>
): void => {
  const pageName = pageInstance.constructor.name;

  const propertyOwner = Object.getPrototypeOf(pageInstance);
  const parentPropertyOwner = Object.getPrototypeOf(propertyOwner);

  const properties = Object.getOwnPropertyNames(propertyOwner);
  const parentProperties = Object.getOwnPropertyNames(parentPropertyOwner);

  const methods = Array.from(new Set([...parentProperties, ...properties]));

  const methodNames = methods.filter(
    method =>
      (pageInstance as any)[method] &&
      typeof (pageInstance as any)[method] === 'function' &&
      (pageInstance as any)[method].constructor.name === 'AsyncFunction' &&
      method !== 'constructor'
  );

  for (const methodName of methodNames) {
    const initialMethod = (pageInstance as any)[methodName];

    (pageInstance as any)[methodName] = async function (...args: any[]) {
      return test.step(`${pageName}.${methodName}`, () => initialMethod.apply(pageInstance, args));
    };
  }
};
