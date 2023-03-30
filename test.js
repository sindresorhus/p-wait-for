import test from 'ava';
import delay from 'delay';
import timeSpan from 'time-span';
import pWaitFor from './index.js';

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
	await t.throwsAsync(pWaitFor(() => {
		throw new Error('foo');
	}));
});

test('waits no longer than `timeout` milliseconds before rejecting', async t => {
	const end = timeSpan();
	const ms = 200;
	const maxWait = 100;

	await t.throwsAsync(pWaitFor(async () => {
		await delay(ms);
		return true;
	}, {
		interval: 20,
		timeout: maxWait,
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
			timeout: 200,
		},
	)
		.catch(async _ => {
			const checksAtTimeout = checksPerformed;
			await delay(100);
			t.is(checksPerformed, checksAtTimeout);
		});
});

test('stops performing async checks if a timeout occurs', async t => {
	let checksPerformed = 0;

	try {
		await pWaitFor(
			async () => {
				await new Promise(resolve => {
					setTimeout(resolve, 20);
				});
				checksPerformed += 1;
				return false;
			},
			{
				interval: 10,
				timeout: 200,
			});
	} catch {
		const checksAtTimeout = checksPerformed;
		await delay(100);
		// One more check might have been run if it was already started
		t.true([checksAtTimeout, checksAtTimeout + 1].includes(checksPerformed));
	}
});

test('does not perform a leading check', async t => {
	const ms = 200;
	const end = timeSpan();

	await pWaitFor(async () => true, {
		interval: ms,
		before: false,
	});

	t.true(end() > (ms - 20));
});

test('resolveWith()', async t => {
	t.true(await pWaitFor(() => pWaitFor.resolveWith(true)));
});

test('timeout option - object', async t => {
	class CustomizedTimeoutError extends Error {
		constructor() {
			super();
			this.name = 'MyError';
			this.message = 'Time’s up!';
		}
	}

	await t.throwsAsync(pWaitFor(async () => {
		await delay(1000);
		return true;
	}, {
		timeout: {
			milliseconds: 100,
			message: new CustomizedTimeoutError(),
		},
	}), {
		name: 'MyError',
		message: 'Time’s up!',
		instanceOf: CustomizedTimeoutError,
	});
});
