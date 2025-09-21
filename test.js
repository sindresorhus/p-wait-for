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

test('rejects if condition throws', async t => {
	const error = new Error('foo');
	await t.throwsAsync(pWaitFor(() => {
		throw error;
	}), {is: error});
});

test('rejects if condition returns non-boolean', async t => {
	await t.throwsAsync(
		pWaitFor(() => 'not a boolean'),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);
});

test('timeout rejects with TimeoutError', async t => {
	const end = timeSpan();

	await t.throwsAsync(
		pWaitFor(() => false, {timeout: 100}),
		{name: 'TimeoutError'},
	);

	const timeTaken = end();
	t.true(timeTaken >= 95); // Allow 5ms tolerance for CI timing variations
	t.true(timeTaken < 200); // Increase upper bound for slow CI environments
});

test('timeout with custom error message', async t => {
	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 100,
				message: 'Custom timeout message',
			},
		}),
		{message: 'Custom timeout message'},
	);
});

test('timeout with custom error object', async t => {
	class CustomError extends Error {
		constructor() {
			super('Custom error');
			this.name = 'CustomError';
		}
	}

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 100,
				message: new CustomError(),
			},
		}),
		{instanceOf: CustomError},
	);
});

test('timeout with fallback function', async t => {
	let fallbackCalled = false;

	const result = await pWaitFor(() => false, {
		timeout: {
			milliseconds: 100,
			fallback() {
				fallbackCalled = true;
				return 'fallback value';
			},
		},
	});

	t.true(fallbackCalled);
	t.is(result, 'fallback value');
});

test('stops checking after timeout', async t => {
	let checks = 0;

	await t.throwsAsync(pWaitFor(() => {
		checks++;
		return false;
	}, {
		interval: 10,
		timeout: 100,
	}));

	const checksAtTimeout = checks;
	await delay(50);
	t.is(checks, checksAtTimeout);
});

test('before option delays first check', async t => {
	const end = timeSpan();

	await pWaitFor(() => true, {
		interval: 100,
		before: false,
	});

	t.true(end() >= 95); // Allow 5ms margin
});

test('resolveWith returns custom value', async t => {
	t.is(await pWaitFor(() => pWaitFor.resolveWith('custom')), 'custom');
	t.is(await pWaitFor(() => pWaitFor.resolveWith(42)), 42);
	t.is(await pWaitFor(() => pWaitFor.resolveWith(undefined)), undefined);
});

test('aborts when signal is aborted', async t => {
	const controller = new AbortController();
	const end = timeSpan();

	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 100);

	await t.throwsAsync(
		pWaitFor(() => false, {
			interval: 10,
			signal: controller.signal,
		}),
		{message: 'Aborted'},
	);

	const timeTaken = end();
	t.true(timeTaken >= 95); // Allow 5ms tolerance for timer precision
	t.true(timeTaken < 150);
});

test('handles pre-aborted signal', async t => {
	const controller = new AbortController();
	controller.abort(new Error('Already aborted'));

	await t.throwsAsync(
		pWaitFor(() => true, {signal: controller.signal}),
		{message: 'Already aborted'},
	);
});

test('stops checking after abort', async t => {
	const controller = new AbortController();
	let checks = 0;

	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 100);

	await t.throwsAsync(pWaitFor(() => {
		checks++;
		return false;
	}, {
		interval: 10,
		signal: controller.signal,
	}));

	const checksAtAbort = checks;
	await delay(50);
	t.is(checks, checksAtAbort);
});

test('signal and timeout work together', async t => {
	const controller = new AbortController();

	// Abort before timeout
	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 50);

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: 200,
			signal: controller.signal,
		}),
		{message: 'Aborted'},
	);
});

test('timeout before abort signal', async t => {
	const controller = new AbortController();

	// Abort after timeout
	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 200);

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: 50,
			signal: controller.signal,
		}),
		{name: 'TimeoutError'},
	);
});

test('resolves with signal when condition becomes true', async t => {
	const controller = new AbortController();
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		interval: 10,
		signal: controller.signal,
	});

	t.true(checks >= 3);
});

test('resolveWith works with timeout', async t => {
	const result = await pWaitFor(() => pWaitFor.resolveWith('value'), {
		timeout: 1000,
	});

	t.is(result, 'value');
});

test('resolveWith works with signal', async t => {
	const controller = new AbortController();

	const result = await pWaitFor(() => pWaitFor.resolveWith('value'), {
		signal: controller.signal,
	});

	t.is(result, 'value');
});

test('interval is respected', async t => {
	let checks = 0;
	const checkTimes = [];

	await pWaitFor(() => {
		checkTimes.push(Date.now());
		checks++;
		return checks >= 3;
	}, {
		interval: 50,
	});

	t.true(checks >= 3);

	// Check intervals between calls (allowing some margin)
	for (let i = 1; i < checkTimes.length; i++) {
		const interval = checkTimes[i] - checkTimes[i - 1];
		t.true(interval >= 45); // Allow 5ms margin
	}
});

test('handles async condition that resolves false multiple times', async t => {
	let checks = 0;

	await pWaitFor(async () => {
		await delay(10);
		checks++;
		return checks >= 5;
	}, {
		interval: 10,
	});

	t.is(checks, 5);
});

test('cleanup happens on successful resolution', async t => {
	// This test ensures cleanup happens by not hanging
	const controller = new AbortController();

	await pWaitFor(() => true, {
		signal: controller.signal,
	});

	// If cleanup didn't happen, this might cause issues
	controller.abort();
	t.pass();
});

test('cleanup happens on error', async t => {
	// This test ensures cleanup happens by not hanging
	const controller = new AbortController();

	await t.throwsAsync(pWaitFor(() => {
		throw new Error('test');
	}, {
		signal: controller.signal,
	}));

	// If cleanup didn't happen, this might cause issues
	controller.abort();
	t.pass();
});

test('throws on invalid timeout.milliseconds', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {
			timeout: {
				message: 'custom message',
			},
		}),
		{instanceOf: TypeError, message: 'Expected timeout.milliseconds to be a finite non-negative number'},
	);
});

test('throws on negative interval', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {interval: -1}),
		{instanceOf: TypeError, message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on NaN interval', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {interval: Number.NaN}),
		{instanceOf: TypeError, message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on Infinity interval', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {interval: Number.POSITIVE_INFINITY}),
		{instanceOf: TypeError, message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on negative timeout', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {timeout: -100}),
		{instanceOf: TypeError, message: 'Expected timeout to be a finite non-negative number'},
	);
});

test('throws on NaN timeout', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {timeout: Number.NaN}),
		{instanceOf: TypeError, message: 'Expected timeout to be a finite non-negative number'},
	);
});

test('throws on negative timeout.milliseconds', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {
			timeout: {milliseconds: -100},
		}),
		{instanceOf: TypeError, message: 'Expected timeout.milliseconds to be a finite non-negative number'},
	);
});

test('throws on NaN timeout.milliseconds', async t => {
	await t.throwsAsync(
		pWaitFor(() => true, {
			timeout: {milliseconds: Number.NaN},
		}),
		{instanceOf: TypeError, message: 'Expected timeout.milliseconds to be a finite non-negative number'},
	);
});

test('handles fallback errors gracefully', async t => {
	const fallbackError = new Error('Fallback failed');

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				fallback() {
					throw fallbackError;
				},
			},
		}),
		{is: fallbackError},
	);
});

test('handles null condition return value', async t => {
	await t.throwsAsync(
		pWaitFor(() => null),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);
});

test('handles undefined condition return value', async t => {
	await t.throwsAsync(
		pWaitFor(() => undefined),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);
});

test('handles promise rejection in condition', async t => {
	const conditionError = new Error('Condition failed');

	await t.throwsAsync(
		pWaitFor(async () => {
			throw conditionError;
		}),
		{is: conditionError},
	);
});

test('works with zero interval', async t => {
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		interval: 0,
	});

	t.true(checks >= 3);
});

test('resolveWith with falsy values', async t => {
	t.is(await pWaitFor(() => pWaitFor.resolveWith(0)), 0);
	t.is(await pWaitFor(() => pWaitFor.resolveWith('')), '');
	t.is(await pWaitFor(() => pWaitFor.resolveWith(false)), false);
	t.is(await pWaitFor(() => pWaitFor.resolveWith(null)), null);
});

test('multiple simultaneous waits with same condition', async t => {
	let counter = 0;
	const condition = () => {
		counter++;
		return counter >= 10;
	};

	const results = await Promise.all([
		pWaitFor(condition),
		pWaitFor(condition),
		pWaitFor(condition),
	]);

	t.deepEqual(results, [undefined, undefined, undefined]);
	t.true(counter >= 10);
});

test('signal abort reason is preserved', async t => {
	const controller = new AbortController();
	const customReason = new Error('Custom abort reason');
	customReason.type = 'custom';

	setTimeout(() => {
		controller.abort(customReason);
	}, 50);

	await t.throwsAsync(
		pWaitFor(() => false, {
			signal: controller.signal,
		}),
		{is: customReason},
	);
});

test('condition can return truthy non-boolean values that get rejected', async t => {
	await t.throwsAsync(
		pWaitFor(() => 'truthy string'),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);

	await t.throwsAsync(
		pWaitFor(() => 42),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);

	await t.throwsAsync(
		pWaitFor(() => []),
		{instanceOf: TypeError, message: 'Expected condition to return a boolean'},
	);
});

test('timeout with Infinity milliseconds never times out', async t => {
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		timeout: {
			milliseconds: Number.POSITIVE_INFINITY,
		},
	});

	t.true(checks >= 3);
});

test('fallback returns undefined works', async t => {
	const result = await pWaitFor(() => false, {
		timeout: {
			milliseconds: 50,
			fallback: () => undefined,
		},
	});

	t.is(result, undefined);
});

test('before false delays first check exactly', async t => {
	const start = Date.now();
	let firstCheckTime;

	await pWaitFor(() => {
		firstCheckTime = Date.now();
		return true;
	}, {
		interval: 100,
		before: false,
	});

	const delay = firstCheckTime - start;
	t.true(delay >= 95); // Allow 5ms margin
});

test('abort before first check', async t => {
	const controller = new AbortController();
	controller.abort(new Error('Aborted before start'));

	await t.throwsAsync(
		pWaitFor(() => true, {signal: controller.signal}),
		{message: 'Aborted before start'},
	);
});

test('abort during sleep between checks', async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('Aborted during sleep'));
	}, 50);

	await t.throwsAsync(
		pWaitFor(() => false, {
			interval: 100,
			signal: controller.signal,
		}),
		{message: 'Aborted during sleep'},
	);
});

test('abort while condition is pending', async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('Aborted during condition'));
	}, 50);

	await t.throwsAsync(
		pWaitFor(async () => {
			await delay(100); // This will be interrupted by the next iteration
			return false; // Force another iteration where abort will be caught
		}, {
			signal: controller.signal,
		}),
		{message: 'Aborted during condition'},
	);
});

test('fallback not used on abort', async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('User abort'));
	}, 50);

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 200,
				fallback: () => 'should not be called',
			},
			signal: controller.signal,
		}),
		{message: 'User abort'},
	);
});

test('sentinel short-circuit on first call', async t => {
	let checks = 0;

	const result = await pWaitFor(() => {
		checks++;
		return pWaitFor.resolveWith('immediate');
	});

	t.is(result, 'immediate');
	t.is(checks, 1);
});

test('timeout message as Error instance', async t => {
	class CustomTimeoutError extends Error {
		constructor() {
			super('Custom timeout occurred');
			this.name = 'CustomTimeoutError';
		}
	}

	const customError = new CustomTimeoutError();

	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				message: customError,
			},
		}),
		{is: customError},
	);
});

test('timeout message as string', async t => {
	await t.throwsAsync(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				message: 'Custom timeout message',
			},
		}),
		{message: 'Custom timeout message'},
	);
});
