export const decorateMethodsWithSteps = function (pageInstance, test) {
	const pageName = pageInstance.constructor.name;

	const propertyOwner = Object.getPrototypeOf(pageInstance);
	const parentPropertyOwner = Object.getPrototypeOf(propertyOwner);

	const properties = Object.getOwnPropertyNames(propertyOwner);
	const parentProperties = Object.getOwnPropertyNames(parentPropertyOwner);

	const methods = Array.from(new Set([...parentProperties, ...properties]));

	const methodNames = methods.filter(
		method =>
			pageInstance[method] &&
			typeof pageInstance[method] === 'function' &&
			pageInstance[method].constructor.name === 'AsyncFunction' &&
			method !== 'constructor' // wrap all async functions in a class, except the constructor
	);

	for (const methodName of methodNames) {
		const initialMethod = pageInstance[methodName];

		pageInstance[methodName] = async function (...args) {
			return test.step(`${pageName}.${methodName}`, () =>
				initialMethod.apply(pageInstance, args));
		};
	}
};
