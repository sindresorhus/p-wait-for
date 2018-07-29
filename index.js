'use strict';
const pTimeout = require('p-timeout');

module.exports = (condition, options) => {
	options = Object.assign({
		interval: 20,
		timeout: Infinity
	}, options);

	const promise = new Promise((resolve, reject) => {
		const check = () => {
			Promise.resolve()
				.then(condition)
				.then(value => {
					if (typeof value !== 'boolean') {
						throw new TypeError('Expected condition to return a boolean');
					}

					if (value === true) {
						resolve();
					} else {
						setTimeout(check, options.interval);
					}
				})
				.catch(reject);
		};

		check();
	});

	if (options.timeout !== Infinity) {
		return pTimeout(promise, options.timeout);
	}

	return promise;
};
