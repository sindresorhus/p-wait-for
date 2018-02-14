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

test('Will wait not longer than `timeout`ms before rejecting', async t => {
	const end = timeSpan();
	const ms = 200;
	const maxWait = 100;
	await t.throws(m(() => delay(ms).then(() => true), 20, {timeout: maxWait}));
	const timeTaken = end();
	t.true(timeTaken < ms);
	t.true(timeTaken > (maxWait - 20));
});
