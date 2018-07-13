'use strict';
const pTimeout = require('p-timeout');

module.exports = (condition, opts) => {
	if (typeof opts === 'number') opts = { interval: opts };
	opts = Object.assign({
		interval: 20,
		timeout: Infinity
	}, opts);
	const promise = new Promise((resolve, reject) => {

		const check = () => {
			Promise.resolve().then(condition).then(val => {
				if (typeof val !== 'boolean') {
					throw new TypeError('Expected condition to return a boolean');
				}

				if (val === true) {
					resolve();
				} else {
					setTimeout(check, opts.interval);
				}
			}).catch(err => {
				reject(err);
			});
		};

		check();
	});

	if (opts.timeout !== Infinity) {
		return pTimeout(promise, opts.timeout);
	}

	return promise;
};
