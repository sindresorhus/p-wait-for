export interface Options {
	/**
	Number of milliseconds to wait before retrying `condition`.

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

/**
Wait for a condition to be true.

@returns A promise that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

@example
```
import pWaitFor from 'p-wait-for';
import pathExists from 'path-exists';

await pWaitFor(() => pathExists('unicorn.png'));
console.log('Yay! The file now exists.');
```
*/
export default function pWaitFor(condition: () => PromiseLike<boolean> | boolean, options?: Options): Promise<void>;

export {TimeoutError} from 'p-timeout';
