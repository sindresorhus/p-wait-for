# p-wait-for [![Build Status](https://travis-ci.org/sindresorhus/p-wait-for.svg?branch=master)](https://travis-ci.org/sindresorhus/p-wait-for)

> Wait for a condition to be true

Can be useful for polling.


## Install

```
$ npm install --save p-wait-for
```


## Usage

```js
const pWaitFor = require('p-wait-for');
const pathExists = require('path-exists');

pWaitFor(() => pathExists('unicorn.png')).then(() => {
	console.log('Yay! The file now exists.');
})
```


## API

### pWaitFor(condition, [interval], [options])

Returns a `Promise` that resolves when `condition` returns `true`. Rejects if `condition` throws or returns a `Promise` that rejects.

#### condition

Type: `Function`

Expected to return a `boolean` or a `Promise` for a `boolean`.

#### interval

Type: `number`<br>
Default: `20`

Number of milliseconds to wait before retrying `condition`.

#### options

##### timeout

Type: `number`<br>
Default: `Infinity`

Number of milliseconds to wait before automatically rejecting.


## Related

- [p-whilst](https://github.com/sindresorhus/p-whilst) - Calls a function repeatedly while a condition returns true and then resolves the promise
- [More…](https://github.com/sindresorhus/promise-fun)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
