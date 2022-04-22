import pTimeout from 'p-timeout';

const resolveValue = Symbol('resolveValue');

export default async function pWaitFor(condition, options = {}) {
	const timeout = options.timeout ? options.timeout : Number.POSITIVE_INFINITY;

	const {
		interval = 20,
		before = true
	} = options;

	let retryTimeout;

	const promise = new Promise((resolve, reject) => {
		const check = async () => {
			try {
				const value = await condition();

				if (typeof value === 'object' && value[resolveValue]) {
					resolve(value[resolveValue]);
				} else if (typeof value !== 'boolean') {
					throw new TypeError('Expected condition to return a boolean');
				} else if (value === true) {
					resolve();
				} else {
					retryTimeout = setTimeout(check, interval);
				}
			} catch (error) {
				reject(error);
			}
		};

		if (before) {
			check();
		} else {
			retryTimeout = setTimeout(check, interval);
		}
	});

	if (timeout === Number.POSITIVE_INFINITY) {
		return promise;
	}

	const milliseconds = timeout;

	const {
		message: timeoutMessage,
		milliseconds: timeoutMs,
		customTimers
	} = typeof timeout === 'number' ? {milliseconds} : timeout;

	const customTimersOptions = customTimers ? {customTimers} : undefined;

	try {
		return await pTimeout(promise, timeoutMs, timeoutMessage, customTimersOptions);
	} catch (error) {
		if (retryTimeout) {
			clearTimeout(retryTimeout);
		}

		throw error;
	}
}

pWaitFor.resolveWith = value => ({[resolveValue]: value});

export {TimeoutError} from 'p-timeout';
