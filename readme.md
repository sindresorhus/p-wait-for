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

Using the `resolve` callback:

```js
import {globby} from 'globby';

const jsFiles = await pWaitFor(async (resolve) => {
  const paths = await globby(['*.js']);
  if (paths.length > 0) {
    return resolve(paths);
  }
});
console.log(jsFiles);
```

Use with TypeScript:

```ts
import {globby} from 'globby';

const tsFiles = await pWaitFor<string[]>(async (resolve) => {
  const paths = await globby(['*.ts']);
  if (paths.length > 0) {
    return resolve(paths);
  }
});
// `tsFiles` is typed as a `string[]`
console.log(tsFiles);
```

## API

### pWaitFor(condition, options?)

Returns a `Promise` that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects. An optional `resolve` callback is passed to `condition` that can be called to return a value from `pWaitFor` once `condition` returns true.

#### condition(resolve)

Type: `Function`

Expected to return `Promise<boolean> | boolean`.

##### resolve(value)

Type: `Function`

Can be called with a value to return from the `pWaitFor` function once the condition returns true. This function always returns true so you can write `return resolve(value)`.

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
