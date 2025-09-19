# p-wait-for

> Wait for a condition to be true

Can be useful for polling.

## Install

```sh
npm install p-wait-for
```

## Usage

```js
import pWaitFor from 'p-wait-for';
import {pathExists} from 'path-exists';

await pWaitFor(() => pathExists('unicorn.png'));
console.log('Yay! The file now exists.');
```

## API

### pWaitFor(condition, options?)

Returns a `Promise` that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

#### condition

Type: `Function`

Expected to return `Promise<boolean> | boolean` or a value from `pWaitFor.resolveWith()`.

#### options

Type: `object`

##### interval

Type: `number`\
Default: `20`

Number of milliseconds to wait after `condition` resolves to `false` before calling it again.

##### timeout

Type: `number | TimeoutOptions`\
Default: `Infinity`

Number of milliseconds to wait before automatically rejecting with a `TimeoutError`.

You can customize the timeout `Error` by specifying `TimeoutOptions`.

```js
import pWaitFor from 'p-wait-for';
import {pathExists} from 'path-exists';

await pWaitFor(() => pathExists('unicorn.png'), {
	timeout: {
		milliseconds: 100,
		message: new Error('Time’s up!')
	}
});

console.log('Yay! The file now exists.');
```

###### milliseconds

Type: `number`

Milliseconds before timing out.

Passing `Infinity` will cause it to never time out.

###### message

Type: `string | Error`

Specify a custom error message or error. If not specified, the default error message will be 'Promise timed out after {milliseconds} milliseconds' where {milliseconds} is replaced with the actual timeout value.

If you do a custom error, it's recommended to sub-class `TimeoutError`.

###### fallback

Type: `Function`

Do something other than rejecting with an error on timeout.

You could for example retry with more attempts.

Example:

```js
import pWaitFor from 'p-wait-for';
import {pathExists} from 'path-exists';

const result = await pWaitFor(() => pathExists('unicorn.png'), {
	timeout: {
		milliseconds: 50,
		fallback: () => {
			console.log('Time’s up! Executed the fallback function.');
			return 'default-value';
		},
	}
});

console.log(result); // 'default-value'
```

##### before

Type: `boolean`\
Default: `true`

Whether to run the check immediately rather than starting by waiting `interval` milliseconds.

Useful for when the check, if run immediately, would likely return `false`. In this scenario, set `before` to `false`.

##### signal

Type: `AbortSignal`

An `AbortSignal` to cancel the wait operation.

### pWaitFor.resolveWith(value)

Resolve the main promise with a custom value.

```js
import pWaitFor from 'p-wait-for';
import {pathExists} from 'path-exists';

const path = await pWaitFor(async () => {
	const path = getPath();
	return await pathExists(path) && pWaitFor.resolveWith(path);
});

console.log(path);
```

### TimeoutError

Exposed for instance checking.

## Related

- [p-whilst](https://github.com/sindresorhus/p-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise
- [More…](https://github.com/sindresorhus/promise-fun)
