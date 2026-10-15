/* eslint-disable no-await-in-loop -- Polling loop: each iteration must await the previous check before sleeping again. */
const resolveValue = Symbol('resolveValue');

const sleep = (ms, signal) => new Promise((resolve, reject) => {
	if (signal?.aborted) {
		reject(signal.reason);
		return;
	}

	const onAbort = () => {
		clearTimeout(timeout);
		reject(signal.reason);
	};

	const timeout = setTimeout(() => {
		// `once: true` only detaches the listener when the signal aborts, so a normal resolve has to remove it.
		signal?.removeEventListener('abort', onAbort);
		resolve();
	}, ms);

	if (signal) {
		signal.addEventListener('abort', onAbort, {once: true});
	}
});

const validateOptions = (interval, timeout) => {
	if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 0) {
		throw new TypeError('Expected interval to be a finite non-negative number');
	}

	if (typeof timeout === 'object' && timeout !== null) {
		if (typeof timeout.milliseconds !== 'number' || Number.isNaN(timeout.milliseconds) || timeout.milliseconds < 0) {
			throw new TypeError('Expected timeout.milliseconds to be a non-negative number');
		}
	} else if (typeof timeout === 'number' && (Number.isNaN(timeout) || timeout < 0)) {
		throw new TypeError('Expected timeout to be a non-negative number');
	}
};

const createTimeoutError = timeout => {
	if (timeout.message instanceof Error) {
		return timeout.message;
	}

	const message = timeout.message ?? `Promise timed out after ${timeout.milliseconds} milliseconds`;
	return new TimeoutError(message);
};

const handleFallback = timeout => {
	if (timeout.fallback) {
		return timeout.fallback();
	}

	throw createTimeoutError(timeout);
};

const handleAbortError = (timeoutSignal, timeout, signal) => {
	if (timeoutSignal?.aborted) {
		// It's a timeout
		if (typeof timeout === 'object') {
			return handleFallback(timeout);
		}

		throw new TimeoutError();
	}

	// It's a user abort
	throw signal.reason;
};

export default async function pWaitFor(condition, options = {}) {
	const {
		interval = 20,
		timeout = Infinity,
		before = true,
		signal,
	} = options;

	validateOptions(interval, timeout);

	// Create combined signal
	const timeoutMs = typeof timeout === 'number' ? timeout : timeout?.milliseconds ?? Infinity;
	const timeoutSignal = timeoutMs === Infinity ? undefined : AbortSignal.timeout(timeoutMs);
	const combinedSignal = timeoutSignal && signal
		? AbortSignal.any([timeoutSignal, signal])
		: (timeoutSignal ?? signal);

	const poll = async () => {
		// Handle initial delay
		if (!before) {
			// The timeout or the user abort can expire here, before `condition` ever runs. The race below handles it.
			await sleep(interval, combinedSignal);
		}

		// Main loop
		while (true) {
			const value = await condition();

			// Check for resolveWith value
			if (typeof value === 'object' && value !== null && Object.hasOwn(value, resolveValue)) {
				return value[resolveValue];
			}

			if (value === true) {
				return;
			}

			if (value === false) {
				// The sleep observes the signal, so an orphaned poll stops here instead of calling `condition` again.
				await sleep(interval, combinedSignal);
				continue;
			}

			throw new TypeError('Expected condition to return a boolean');
		}
	};

	if (!combinedSignal) {
		return poll();
	}

	// Check for pre-abort
	if (combinedSignal.aborted) {
		return handleAbortError(timeoutSignal, timeout, signal);
	}

	// Race the poll against the signal so an abort settles the wait even while `condition` is pending. The pending `condition` is not cancelled.
	const {promise: abortPromise, reject} = Promise.withResolvers();
	const onAbort = () => {
		reject(combinedSignal.reason);
	};

	combinedSignal.addEventListener('abort', onAbort, {once: true});

	try {
		return await Promise.race([poll(), abortPromise]);
	} catch (error) {
		// Handle timeout vs abort vs condition error
		if (combinedSignal.aborted && error === combinedSignal.reason) {
			return handleAbortError(timeoutSignal, timeout, signal);
		}

		// Some other error from condition()
		throw error;
	} finally {
		// `once: true` only detaches the listener when the signal aborts, so a settled wait has to remove it.
		combinedSignal.removeEventListener('abort', onAbort);
	}
}

pWaitFor.resolveWith = value => ({[resolveValue]: value});

export class TimeoutError extends Error {
	constructor(message = 'Promise timed out') {
		super(message);
		this.name = 'TimeoutError';
	}
}
