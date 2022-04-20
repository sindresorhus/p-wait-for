export interface Options {
	/**
	Number of milliseconds to wait after `condition` resolves to `false` before calling it again.

	@default 20
	*/
	readonly interval?: number;

	/**
	Number of milliseconds to wait before automatically rejecting with a `TimeoutError`.

	@default Infinity
	*/
	readonly timeout?: number;

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
export default function pWaitFor<ResolveValueType>(condition: () => PromiseLike<boolean> | boolean | ResolveValue<ResolveValueType> | PromiseLike<ResolveValue<ResolveValueType>>, options?: Options): Promise<ResolveValueType>;

/**
Resolve the main promise with a custom value.

@example
```
import pWaitFor, {resolveWith} from 'p-wait-for';
import pathExists from 'path-exists';

const path = await pWaitFor(async () => {
	const path = getPath();

	if (await pathExists(path)) {
		return resolveWith(path);
	}
});

console.log(path);
```
*/
export function resolveWith<ValueType>(value: ValueType): ResolveValue<ValueType>;

export {TimeoutError} from 'p-timeout';
