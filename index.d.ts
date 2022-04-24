import {Options as pTimeoutOptions} from 'p-timeout';

export interface TimeoutOptions {
	/**
	Milliseconds before timing out.

	Error will be thrown if `pWaitFor` promise hasn't resolved/rejected until this `milliseconds`.

	Passing `Infinity` will cause it to never time out.

	@default Infinity
	*/
	milliseconds?: number;

	/**
	Specify a custom error message or error.

	If you do a custom error, it's recommended to sub-class `TimeoutError`.
	*/
	message?: string | Error;

	/**
	Custom implementations for the `setTimeout` and `clearTimeout` functions.

	Useful for testing purposes, in particular to work around [`sinon.useFakeTimers()`](https://sinonjs.org/releases/latest/fake-timers/).
	*/
	customTimers?: pTimeoutOptions['customTimers'];
}

export interface Options {
	/**
	Number of milliseconds to wait after `condition` resolves to `false` before calling it again.

	@default 20
	*/
	readonly interval?: number;

	/**
	Number of milliseconds to wait before automatically rejecting with a `TimeoutError`.

	You can customize the timeout `Error` by specifying `TimeoutOptions`.

	@default Infinity

	@example
	```
	import pWaitFor from 'p-wait-for';
	import {pathExists} from 'path-exists';

	await pWaitFor(() => pathExists('unicorn.png'), {
		timeout: {
			milliseconds: 100,
			message: new MyError('Time’s up!'),
			customTimers: {
				setTimeout: requestAnimationFrame
			}
		}
	});

	console.log('Yay! The file now exists.');
	```
	*/
	readonly timeout?: number | TimeoutOptions;

	/**
	Whether to run the check immediately rather than starting by waiting `interval` milliseconds.

	Useful for when the check, if run immediately, would likely return `false`. In this scenario, set `before` to `false`.

	@default true
	*/
	readonly before?: boolean;
}

// https://github.com/sindresorhus/type-fest/blob/043b732bf02c2b700245aa6501116a6646d50732/source/opaque.d.ts
declare const resolveValueSymbol: unique symbol;

interface ResolveValue<ResolveValueType> {
	[resolveValueSymbol]: ResolveValueType;
}

declare const pWaitFor: {
	/**
	Wait for a condition to be true.

	@returns A promise that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

	@example
	```
	import pWaitFor from 'p-wait-for';
	import {pathExists} from 'path-exists';

	await pWaitFor(() => pathExists('unicorn.png'));
	console.log('Yay! The file now exists.');
	```
	*/
	<ResolveValueType>(condition: () => PromiseLike<boolean> | boolean | ResolveValue<ResolveValueType> | PromiseLike<ResolveValue<ResolveValueType>>, options?: Options): Promise<ResolveValueType>;

	/**
	Resolve the main promise with a custom value.

	@example
	```
	import pWaitFor from 'p-wait-for';
	import pathExists from 'path-exists';

	const path = await pWaitFor(async () => {
		const path = getPath();
		return await pathExists(path) && pWaitFor.resolveWith(path);
	});

	console.log(path);
	```
	*/
	resolveWith<ValueType>(value: ValueType): ResolveValue<ValueType>;
};

export default pWaitFor;

export {TimeoutError} from 'p-timeout';
