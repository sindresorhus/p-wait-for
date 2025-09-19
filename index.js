/* eslint-disable no-await-in-loop, complexity */
const resolveValue = Symbol('resolveValue');

const sleep = (ms, signal) => new Promise((resolve, reject) => {
	if (signal?.aborted) {
		reject(signal.reason);
		return;
	}

	const timeout = setTimeout(resolve, ms);

	if (signal) {
		signal.addEventListener('abort', () => {
			clearTimeout(timeout);
			reject(signal.reason);
		}, {once: true});
	}
});

const validateOptions = (interval, timeout) => {
	if (typeof interval !== 'number' || !Number.isFinite(interval) || interval < 0) {
		throw new TypeError('Expected interval to be a finite non-negative number');
	}

	if (typeof timeout === 'object' && timeout !== null) {
		if (typeof timeout.milliseconds !== 'number' || Number.isNaN(timeout.milliseconds) || timeout.milliseconds < 0) {
			throw new TypeError('Expected timeout.milliseconds to be a finite non-negative number');
		}
	} else if (typeof timeout === 'number' && (Number.isNaN(timeout) || timeout < 0)) {
		throw new TypeError('Expected timeout to be a finite non-negative number');
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
		timeout = Number.POSITIVE_INFINITY,
		before = true,
		signal,
	} = options;

	validateOptions(interval, timeout);

	// Create combined signal
	const timeoutMs = typeof timeout === 'number' ? timeout : timeout?.milliseconds ?? Number.POSITIVE_INFINITY;
	const timeoutSignal = timeoutMs === Number.POSITIVE_INFINITY ? undefined : AbortSignal.timeout(timeoutMs);
	const combinedSignal = timeoutSignal && signal
		? AbortSignal.any([timeoutSignal, signal])
		: (timeoutSignal ?? signal);

	// Handle initial delay
	if (!before) {
		await sleep(interval, combinedSignal);
	}

	// Check for pre-abort
	if (combinedSignal?.aborted) {
		return handleAbortError(timeoutSignal, timeout, signal);
	}

	// Main loop
	while (true) {
		try {
			const value = await condition();

			// Check for resolveWith value
			if (typeof value === 'object' && value !== null && resolveValue in value) {
				return value[resolveValue];
			}

			if (value === true) {
				return;
			}

			if (value === false) {
				await sleep(interval, combinedSignal);
				continue;
			}

			throw new TypeError('Expected condition to return a boolean');
		} catch (error) {
			// Handle timeout vs abort vs condition error
			if (error === combinedSignal?.reason) {
				return handleAbortError(timeoutSignal, timeout, signal);
			}

			// Some other error from condition()
			throw error;
		}
	}
}

pWaitFor.resolveWith = value => ({[resolveValue]: value});

export class TimeoutError extends Error {
	constructor(message = 'Promise timed out') {
		super(message);
		this.name = 'TimeoutError';
	}
}
