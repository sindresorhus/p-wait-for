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

Using an array as the return value:

```js
import {globby} from 'globby';

const jsFiles = await pWaitFor(async () => {
  const paths = await globby(['*.js']);
  return [paths.length > 0, paths];
});
console.log(jsFiles);
```

Usage with TypeScript:

```ts
import {globby} from 'globby';

const tsFiles = await pWaitFor(async () => {
  const paths = await globby(['*.ts']);
  return [paths.length > 0, paths];
});
// `tsFiles` is typed as a `string[]`
console.log(tsFiles);
```

>>>>>>> 2b859c3 (docs: update with optional array return value)
## API

### pWaitFor(condition, options?)

Returns a `Promise` that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

#### condition

Type: `Function`

Expected to return either `Promise<boolean> | boolean` or `Promise<[boolean, T]> | [boolean, T]` where T is the type of the value returned by `pWaitFor`.

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

### TimeoutError

Exposed for instance checking.

## Related

- [p-whilst](https://github.com/sindresorhus/p-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise
- [More…](https://github.com/sindresorhus/promise-fun)
