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

Expected to return `Promise<boolean> | boolean`.

#### options

Type: `object`

##### interval

Type: `number`\
Default: `20`

Number of milliseconds to wait after `condition` resolves to `false` before calling it again.

##### timeout

Type: `number`\
Default: `Infinity`

Number of milliseconds to wait before automatically rejecting with a `TimeoutError`.

##### before

Type: `boolean`\
Default: `true`

Whether to run the check immediately rather than starting by waiting `interval` milliseconds.

Useful for when the check, if run immediately, would likely return `false`. In this scenario, set `before` to `false`.

#### resolveWith(value)

Resolve the main promise with a custom value.

```js
import pWaitFor from 'p-wait-for';
import pathExists from 'path-exists';

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
