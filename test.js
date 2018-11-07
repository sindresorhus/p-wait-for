import test from 'ava';
import delay from 'delay';
import timeSpan from 'time-span';
import pWaitFor from '.';

test('waits for condition', async t => {
	const ms = 200;
	const end = timeSpan();

	await pWaitFor(async () => {
		await delay(ms);
		return true;
	});

	t.true(end() > (ms - 20));
});

test('rejects promise if condition rejects or throws', async t => {
	await t.throws(pWaitFor(() => {
		throw new Error('foo');
	}));
});

test('waits no longer than `timeout` milliseconds before rejecting', async t => {
	const end = timeSpan();
	const ms = 200;
	const maxWait = 100;

	await t.throws(pWaitFor(async () => {
		await delay(ms);
		return true;
	}, {
		interval: 20,
		timeout: maxWait
	}));

	const timeTaken = end();
	t.true(timeTaken < ms);
	t.true(timeTaken > (maxWait - 20));
});

test('stops performing checks if a timeout occurs', async t => {
	let checksPerformed = 0;

	await pWaitFor(
		() => {
			checksPerformed += 1;
			return false;
		},
		{
			interval: 10,
			timeout: 200
		}
	)
		.catch(async _ => {
			const checksAtTimeout = checksPerformed;
			await delay(100);
			t.is(checksPerformed, checksAtTimeout);
		});
});
