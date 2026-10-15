/* eslint-disable node-test/no-conditional-assertion -- The interval test is table-driven: every recorded gap is asserted inside the loop. */
import {getEventListeners} from 'node:events';
import process from 'node:process';
import {setTimeout as delay} from 'node:timers/promises';
import test from 'node:test';
import timeSpan from 'time-span';
import pWaitFor from './index.js';

const abortListenerCount = signal => getEventListeners(signal, 'abort').length;

test('waits for condition', {timeout: 30_000}, async t => {
	const ms = 200;
	const end = timeSpan();

	await pWaitFor(async () => {
		await delay(ms);
		return true;
	});

	t.assert.ok(end() > (ms - 20));
});

test('rejects if condition throws', {timeout: 30_000}, async t => {
	const error = new Error('foo');
	await t.assert.rejects(pWaitFor(() => {
		throw error;
	}), thrown => thrown === error);
});

test('rejects if condition returns non-boolean', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => 'not a boolean'),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);
});

test('timeout rejects with TimeoutError', {timeout: 30_000}, async t => {
	const end = timeSpan();

	await t.assert.rejects(
		pWaitFor(() => false, {timeout: 100}),
		{name: 'TimeoutError'},
	);

	const timeTaken = end();
	t.assert.ok(timeTaken >= 95); // Allow 5ms tolerance for CI timing variations
	t.assert.ok(timeTaken < 200); // Increase upper bound for slow CI environments
});

test('timeout has a default message', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => false, {timeout: 100}),
		{name: 'TimeoutError', message: 'Promise timed out'},
	);

	await t.assert.rejects(
		pWaitFor(() => false, {timeout: {milliseconds: 100}}),
		{name: 'TimeoutError', message: 'Promise timed out after 100 milliseconds'},
	);
});

test('timeout with custom error message', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 100,
				message: 'Custom timeout message',
			},
		}),
		{message: 'Custom timeout message'},
	);
});

test('timeout with custom error object', {timeout: 30_000}, async t => {
	class CustomError extends Error {
		constructor() {
			super('Custom error');
			this.name = 'CustomError';
		}
	}

	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 100,
				message: new CustomError(),
			},
		}),
		{name: 'CustomError'},
	);
});

test('timeout with fallback function', {timeout: 30_000}, async t => {
	let wasFallbackCalled = false;

	const result = await pWaitFor(() => false, {
		timeout: {
			milliseconds: 100,
			fallback() {
				wasFallbackCalled = true;
				return 'fallback value';
			},
		},
	});

	t.assert.ok(wasFallbackCalled);
	t.assert.strictEqual(result, 'fallback value');
});

test('timeout with fallback function when `before` is false', {timeout: 30_000}, async t => {
	let wasFallbackCalled = false;

	// The timeout expires during the initial `interval` delay, before `condition` ever runs.
	const result = await pWaitFor(() => false, {
		before: false,
		interval: 200,
		timeout: {
			milliseconds: 50,
			fallback() {
				wasFallbackCalled = true;
				return 'fallback value';
			},
		},
	});

	t.assert.ok(wasFallbackCalled);
	t.assert.strictEqual(result, 'fallback value');
});

test('timeout with custom error message when `before` is false', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => false, {
			before: false,
			interval: 200,
			timeout: {
				milliseconds: 50,
				message: 'Custom timeout message',
			},
		}),
		{message: 'Custom timeout message'},
	);
});

test('stops checking after timeout', {timeout: 30_000}, async t => {
	let checks = 0;

	await t.assert.rejects(pWaitFor(() => {
		checks++;
		return false;
	}, {
		interval: 10,
		timeout: 100,
	}), {name: 'TimeoutError'});

	const checksAtTimeout = checks;
	await delay(50);
	t.assert.strictEqual(checks, checksAtTimeout);
});

test('before option delays first check', {timeout: 30_000}, async t => {
	const end = timeSpan();

	await pWaitFor(() => true, {
		interval: 100,
		before: false,
	});

	t.assert.ok(end() >= 95); // Allow 5ms margin
});

test('resolveWith returns custom value', {timeout: 30_000}, async t => {
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith('custom')), 'custom');
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith(42)), 42);
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith(undefined)), undefined);
});

test('aborts when signal is aborted', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	const end = timeSpan();

	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 100);

	await t.assert.rejects(
		pWaitFor(() => false, {
			interval: 10,
			signal: controller.signal,
		}),
		{message: 'Aborted'},
	);

	const timeTaken = end();
	t.assert.ok(timeTaken >= 95); // Allow 5ms tolerance for timer precision
	t.assert.ok(timeTaken < 150);
});

test('handles pre-aborted signal', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	controller.abort(new Error('Already aborted'));

	await t.assert.rejects(
		pWaitFor(() => true, {signal: controller.signal}),
		{message: 'Already aborted'},
	);
});

test('stops checking after abort', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	let checks = 0;

	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 100);

	await t.assert.rejects(pWaitFor(() => {
		checks++;
		return false;
	}, {
		interval: 10,
		signal: controller.signal,
	}), {message: 'Aborted'});

	const checksAtAbort = checks;
	await delay(50);
	t.assert.strictEqual(checks, checksAtAbort);
});

test('signal and timeout work together', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	// Abort before timeout
	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 50);

	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: 200,
			signal: controller.signal,
		}),
		{message: 'Aborted'},
	);
});

test('timeout before abort signal', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	// Abort after timeout
	setTimeout(() => {
		controller.abort(new Error('Aborted'));
	}, 200);

	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: 50,
			signal: controller.signal,
		}),
		{name: 'TimeoutError'},
	);
});

test('resolves with signal when condition becomes true', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		interval: 10,
		signal: controller.signal,
	});

	t.assert.ok(checks >= 3);
});

test('resolveWith works with timeout', {timeout: 30_000}, async t => {
	const result = await pWaitFor(() => pWaitFor.resolveWith('value'), {
		timeout: 1000,
	});

	t.assert.strictEqual(result, 'value');
});

test('resolveWith works with signal', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	const result = await pWaitFor(() => pWaitFor.resolveWith('value'), {
		signal: controller.signal,
	});

	t.assert.strictEqual(result, 'value');
});

test('interval is respected', {timeout: 30_000}, async t => {
	let checks = 0;
	const checkTimes = [];

	await pWaitFor(() => {
		checkTimes.push(Date.now());
		checks++;
		return checks >= 3;
	}, {
		interval: 50,
	});

	t.assert.ok(checks >= 3);

	// Check intervals between calls (allowing some margin)
	for (let i = 1; i < checkTimes.length; i++) {
		const interval = checkTimes[i] - checkTimes[i - 1];
		t.assert.ok(interval >= 45); // Allow 5ms margin
	}
});

test('handles async condition that resolves false multiple times', {timeout: 30_000}, async t => {
	let checks = 0;

	await pWaitFor(async () => {
		await delay(10);
		checks++;
		return checks >= 5;
	}, {
		interval: 10,
	});

	t.assert.strictEqual(checks, 5);
});

test('cleanup happens on successful resolution', {timeout: 30_000}, async t => {
	// `once: true` only detaches on abort, so a poll that completes has to remove its own listener.
	const controller = new AbortController();
	let polls = 0;

	await pWaitFor(() => ++polls >= 2, {
		interval: 0,
		signal: controller.signal,
	});

	t.assert.strictEqual(abortListenerCount(controller.signal), 0);
});

test('cleanup happens on error', {timeout: 30_000}, async t => {
	// This test ensures cleanup happens by not hanging
	const controller = new AbortController();

	await t.assert.rejects(pWaitFor(() => {
		throw new Error('test');
	}, {
		signal: controller.signal,
	}), {message: 'test'});

	t.assert.strictEqual(abortListenerCount(controller.signal), 0);

	// If cleanup didn't happen, this might cause issues
	controller.abort();
});

test('throws on invalid timeout.milliseconds', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {
			timeout: {
				message: 'custom message',
			},
		}),
		{name: 'TypeError', message: 'Expected timeout.milliseconds to be a non-negative number'},
	);
});

test('throws on negative interval', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {interval: -1}),
		{name: 'TypeError', message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on NaN interval', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {interval: NaN}),
		{name: 'TypeError', message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on Infinity interval', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {interval: Infinity}),
		{name: 'TypeError', message: 'Expected interval to be a finite non-negative number'},
	);
});

test('throws on negative timeout', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {timeout: -100}),
		{name: 'TypeError', message: 'Expected timeout to be a non-negative number'},
	);
});

test('throws on NaN timeout', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {timeout: NaN}),
		{name: 'TypeError', message: 'Expected timeout to be a non-negative number'},
	);
});

test('throws on negative timeout.milliseconds', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {
			timeout: {milliseconds: -100},
		}),
		{name: 'TypeError', message: 'Expected timeout.milliseconds to be a non-negative number'},
	);
});

test('throws on NaN timeout.milliseconds', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => true, {
			timeout: {milliseconds: NaN},
		}),
		{name: 'TypeError', message: 'Expected timeout.milliseconds to be a non-negative number'},
	);
});

test('handles fallback errors gracefully', {timeout: 30_000}, async t => {
	const fallbackError = new Error('Fallback failed');

	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				fallback() {
					throw fallbackError;
				},
			},
		}),
		thrown => thrown === fallbackError,
	);
});

test('handles null condition return value', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => null),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);
});

test('handles undefined condition return value', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => undefined),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);
});

test('handles promise rejection in condition', {timeout: 30_000}, async t => {
	const conditionError = new Error('Condition failed');

	await t.assert.rejects(
		pWaitFor(async () => {
			throw conditionError;
		}),
		thrown => thrown === conditionError,
	);
});

test('works with zero interval', {timeout: 30_000}, async t => {
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		interval: 0,
	});

	t.assert.ok(checks >= 3);
});

test('resolveWith with falsy values', {timeout: 30_000}, async t => {
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith(0)), 0);
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith('')), '');
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith(false)), false);
	t.assert.strictEqual(await pWaitFor(() => pWaitFor.resolveWith(null)), null);
});

test('multiple simultaneous waits with same condition', {timeout: 30_000}, async t => {
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

	t.assert.deepStrictEqual(results, [undefined, undefined, undefined]);
	t.assert.ok(counter >= 10);
});

test('signal abort reason is preserved', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	const customReason = new Error('Custom abort reason');
	customReason.type = 'custom';

	setTimeout(() => {
		controller.abort(customReason);
	}, 50);

	await t.assert.rejects(
		pWaitFor(() => false, {
			signal: controller.signal,
		}),
		thrown => thrown === customReason,
	);
});

test('condition can return truthy non-boolean values that get rejected', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => 'truthy string'),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);

	await t.assert.rejects(
		pWaitFor(() => 42),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);

	await t.assert.rejects(
		pWaitFor(() => []),
		{name: 'TypeError', message: 'Expected condition to return a boolean'},
	);
});

test('timeout with Infinity milliseconds never times out', {timeout: 30_000}, async t => {
	let checks = 0;

	await pWaitFor(() => {
		checks++;
		return checks >= 3;
	}, {
		timeout: {
			milliseconds: Infinity,
		},
	});

	t.assert.ok(checks >= 3);
});

test('fallback returns undefined works', {timeout: 30_000}, async t => {
	const result = await pWaitFor(() => false, {
		timeout: {
			milliseconds: 50,
			fallback: () => undefined,
		},
	});

	t.assert.strictEqual(result, undefined);
});

test('before false delays first check exactly', {timeout: 30_000}, async t => {
	const start = Date.now();
	let firstCheckTime;

	await pWaitFor(() => {
		firstCheckTime = Date.now();
		return true;
	}, {
		interval: 100,
		before: false,
	});

	const elapsed = firstCheckTime - start;
	t.assert.ok(elapsed >= 95); // Allow 5ms margin
});

test('abort before first check', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	controller.abort(new Error('Aborted before start'));

	await t.assert.rejects(
		pWaitFor(() => true, {signal: controller.signal}),
		{message: 'Aborted before start'},
	);
});

test('abort during sleep between checks', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('Aborted during sleep'));
	}, 50);

	await t.assert.rejects(
		pWaitFor(() => false, {
			interval: 100,
			signal: controller.signal,
		}),
		{message: 'Aborted during sleep'},
	);
});

test('abort while condition is pending', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('Aborted during condition'));
	}, 50);

	await t.assert.rejects(
		pWaitFor(async () => {
			await delay(100); // The abort settles the wait while this is pending
			return false; // The orphaned poll then stops at the aborted sleep
		}, {
			signal: controller.signal,
		}),
		{message: 'Aborted during condition'},
	);
});

test('fallback not used on abort', {timeout: 30_000}, async t => {
	const controller = new AbortController();

	setTimeout(() => {
		controller.abort(new Error('User abort'));
	}, 50);

	await t.assert.rejects(
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

test('sentinel short-circuit on first call', {timeout: 30_000}, async t => {
	let checks = 0;

	const result = await pWaitFor(() => {
		checks++;
		return pWaitFor.resolveWith('immediate');
	});

	t.assert.strictEqual(result, 'immediate');
	t.assert.strictEqual(checks, 1);
});

test('timeout message as Error instance', {timeout: 30_000}, async t => {
	class CustomTimeoutError extends Error {
		constructor() {
			super('Custom timeout occurred');
			this.name = 'CustomTimeoutError';
		}
	}

	const customError = new CustomTimeoutError();

	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				message: customError,
			},
		}),
		thrown => thrown === customError,
	);
});

test('timeout message as string', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => false, {
			timeout: {
				milliseconds: 50,
				message: 'Custom timeout message',
			},
		}),
		{message: 'Custom timeout message'},
	);
});

test('removes the abort listener once each poll settles', {timeout: 30_000}, async t => {
	// `once: true` only detaches on abort, so every completed poll left a listener holding its timer.
	const controller = new AbortController();
	const {signal} = controller;

	let polls = 0;
	await pWaitFor(() => ++polls >= 200, {interval: 0, signal});
	t.assert.strictEqual(abortListenerCount(signal), 0);

	await pWaitFor(() => true, {interval: 0, signal});
	t.assert.strictEqual(abortListenerCount(signal), 0);

	// An abort still rejects a pending wait.
	const pending = pWaitFor(() => false, {interval: 5, signal});
	controller.abort(new Error('stop'));
	await t.assert.rejects(pending, {message: 'stop'});
});

test('abort rejects while the condition is pending', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	let checks = 0;

	const waiting = pWaitFor(async () => {
		checks++;
		await delay(200);
		return true;
	}, {signal: controller.signal});

	setTimeout(() => {
		controller.abort(new Error('cancelled'));
	}, 10);

	const end = timeSpan();
	await t.assert.rejects(waiting, {message: 'cancelled'});
	t.assert.ok(end() < 150);
	t.assert.strictEqual(checks, 1);
});

test('timeout rejects while the condition is pending', {timeout: 30_000}, async t => {
	const end = timeSpan();

	await t.assert.rejects(
		pWaitFor(async () => {
			await delay(200);
			return true;
		}, {timeout: 10}),
		{name: 'TimeoutError'},
	);

	t.assert.ok(end() < 150);
});

test('timeout fallback runs while the condition is pending', {timeout: 30_000}, async t => {
	const result = await pWaitFor(async () => {
		await delay(200);
		return true;
	}, {
		timeout: {
			milliseconds: 10,
			fallback: () => 'fallback',
		},
	});

	t.assert.strictEqual(result, 'fallback');
});

test('a condition that settles after abort is not called again', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	let checks = 0;

	const waiting = pWaitFor(async () => {
		checks++;
		await delay(50);
		return false;
	}, {interval: 0, signal: controller.signal});

	controller.abort(new Error('cancelled'));
	await t.assert.rejects(waiting, {message: 'cancelled'});

	await delay(150);
	t.assert.strictEqual(checks, 1);
	t.assert.strictEqual(abortListenerCount(controller.signal), 0);
});

test('a condition that rejects after abort does not cause an unhandled rejection', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	const unhandled = [];
	const onUnhandledRejection = reason => {
		unhandled.push(reason);
	};

	process.on('unhandledRejection', onUnhandledRejection);
	t.after(() => {
		process.off('unhandledRejection', onUnhandledRejection);
	});

	const waiting = pWaitFor(async () => {
		await delay(50);
		throw new Error('late failure');
	}, {signal: controller.signal});

	controller.abort(new Error('cancelled'));
	await t.assert.rejects(waiting, {message: 'cancelled'});

	await delay(150);
	t.assert.deepStrictEqual(unhandled, []);
});

test('timeout and signal together settle the wait while the condition is pending', {timeout: 30_000}, async t => {
	const slowCondition = async () => {
		await delay(200);
		return true;
	};

	await t.assert.rejects(
		pWaitFor(slowCondition, {timeout: 10, signal: new AbortController().signal}),
		{name: 'TimeoutError'},
	);

	const controller = new AbortController();
	const waiting = pWaitFor(slowCondition, {timeout: 60_000, signal: controller.signal});
	controller.abort(new Error('cancelled'));
	await t.assert.rejects(waiting, {message: 'cancelled'});
});

test('abort during the initial `before: false` delay never calls the condition', {timeout: 30_000}, async t => {
	const controller = new AbortController();
	let checks = 0;

	const waiting = pWaitFor(() => {
		checks++;
		return true;
	}, {
		before: false,
		interval: 50,
		signal: controller.signal,
	});

	controller.abort(new Error('cancelled'));
	await t.assert.rejects(waiting, {message: 'cancelled'});

	await delay(100);
	t.assert.strictEqual(checks, 0);
});

test('a condition that throws `undefined` rejects with it when a timeout is set', {timeout: 30_000}, async t => {
	await t.assert.rejects(
		pWaitFor(() => {
			throw undefined; // eslint-disable-line no-throw-literal -- An `undefined` error must not be mistaken for the unset `signal.reason`.
		}, {timeout: 1000}),
		thrown => thrown === undefined,
	);
});
