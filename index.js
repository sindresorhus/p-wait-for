'use strict';
const pTimeout = require('p-timeout');

const pWaitFor = async (condition, options) => {
	options = {
		interval: 20,
		timeout: Infinity,
		...options
	};

	let retryTimeout;

	const promise = new Promise((resolve, reject) => {
		const check = async () => {
			try {
				const value = await condition();

				if (typeof value !== 'boolean') {
					throw new TypeError('Expected condition to return a boolean');
				}

				if (value === true) {
					resolve();
				} else {
					retryTimeout = setTimeout(check, options.interval);
				}
			} catch (error) {
				reject(error);
			}
		};

		check();
	});

	if (options.timeout !== Infinity) {
		try {
			return await pTimeout(promise, options.timeout);
		} catch (error) {
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}

			throw error;
		}
	}

	return promise;
};

module.exports = pWaitFor;
module.exports.default = pWaitFor;
