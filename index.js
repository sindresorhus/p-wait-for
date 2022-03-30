import pTimeout from 'p-timeout';

export default async function pWaitFor(condition, options = {}) {
	const {
		interval = 20,
		timeout = Number.POSITIVE_INFINITY,
		before = true,
	} = options;

	let retryTimeout;

	const promise = new Promise((resolve, reject) => {
		const check = async () => {
			try {
				const value = await condition();

				if (
					typeof value !== 'boolean'
					|| !(Array.isArray(value) && value.length === 2)
				) {
					throw new TypeError(
						'Expected condition to return a boolean or an array of length 2',
					);
				}

				if (typeof value === 'boolean' && value === true) {
					resolve();
				} else if (Array.isArray(value) && value[0] === true) {
					resolve(value[1]);
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

	if (timeout !== Number.POSITIVE_INFINITY) {
		try {
			return await pTimeout(promise, timeout);
		} catch (error) {
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}

			throw error;
		}
	}

	return promise;
}

export {TimeoutError} from 'p-timeout';
