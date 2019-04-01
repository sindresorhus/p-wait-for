declare namespace pWaitFor {
	interface Options {
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
}

declare const pWaitFor: {
	/**
	Wait for a condition to be true.

	@returns A promise that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

	@example
	```
	import pWaitFor = require('p-wait-for');
	import pathExists = require('path-exists');

	(async () => {
		await pWaitFor(() => pathExists('unicorn.png'));
		console.log('Yay! The file now exists.');
	})();
	```
	*/
	(condition: () => PromiseLike<boolean> | boolean, options?: pWaitFor.Options): Promise<
		void
	>;

	// TODO: Remove this for the next major release, refactor the whole definition to:
	// declare function pWaitFor(
	// 	condition: () => PromiseLike<boolean> | boolean,
	// 	options?: pWaitFor.Options
	// ): Promise<void>;
	// export = pWaitFor;
	default: typeof pWaitFor;
};

export = pWaitFor;
