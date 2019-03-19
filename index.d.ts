export interface Options {
	/**
	Number of milliseconds to wait before retrying `condition`.

	@default 20
	*/
	readonly interval?: number;

	/**
	Number of milliseconds to wait before automatically rejecting.

	@default Infinity
	*/
	readonly timeout?: number;
}

/**
Wait for a condition to be true.

@param condition - Expected to return a `boolean` or a `Promise` for a `boolean`.
@returns Resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.
*/
export default function pWaitFor(
	condition: () => PromiseLike<boolean> | boolean,
	options?: Options
): Promise<void>;
