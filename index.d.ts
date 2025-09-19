export type TimeoutOptions<ResolveValueType> = {
	/**
	Milliseconds before timing out.
	*/
	readonly milliseconds: number;

	/**
	Specify a custom error message or error.

	If not specified, the default error message will be 'Promise timed out after {milliseconds} milliseconds' where {milliseconds} is replaced with the actual timeout value.
	*/
	readonly message?: string | Error;

	/**
	Do something other than rejecting with an error on timeout.

	You could for example retry with more attempts.
	*/
	readonly fallback?: () => ResolveValueType;
};

export type Options<ResolveValueType> = {
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
			message: new Error('Time's up!')
		}
	});

	console.log('Yay! The file now exists.');
	```
	*/
	readonly timeout?: number | TimeoutOptions<ResolveValueType>;

	/**
	Whether to run the check immediately rather than starting by waiting `interval` milliseconds.

	Useful for when the check, if run immediately, would likely return `false`. In this scenario, set `before` to `false`.

	@default true
	*/
	readonly before?: boolean;

	/**
	An `AbortSignal` to cancel the wait operation.
	*/
	readonly signal?: AbortSignal;
};

// https://github.com/sindresorhus/type-fest/blob/043b732bf02c2b700245aa6501116a6646d50732/source/opaque.d.ts
declare const resolveValueSymbol: unique symbol;

type ResolveValue<ResolveValueType> = {
	[resolveValueSymbol]: ResolveValueType;
};

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
	<ResolveValueType>(
		condition: () => PromiseLike<boolean | ResolveValue<ResolveValueType>> | boolean | ResolveValue<ResolveValueType>,
		options?: Options<ResolveValueType>
	): Promise<ResolveValueType>;

	/**
	Resolve the main promise with a custom value.

	@example
	```
	import pWaitFor from 'p-wait-for';
	import {pathExists} from 'path-exists';

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

export class TimeoutError extends Error {
	constructor(message?: string);
	readonly name: 'TimeoutError';
}
