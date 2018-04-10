import test from 'ava';
import delay from 'delay';
import timeSpan from 'time-span';
import m from '.';

const fixture = Symbol('unicorn');

test('waits for condition', async t => {
	const ms = 200;
	const end = timeSpan();
	const val = await m(() => delay(ms).then(() => true)).then(() => fixture);
	t.is(val, fixture);
	t.true(end() > (ms - 20));
});

test('rejects promise if condition rejects or throws', async t => {
	await t.throws(m(() => Promise.reject(new Error('foo'))));
});
