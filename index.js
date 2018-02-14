'use strict';
const pTimeout = require('p-timeout');

module.exports = (condition, interval, opts) => {
	const promise = new Promise((resolve, reject) => {
		interval = typeof interval === 'number' ? interval : 20;

		const check = () => {
			Promise.resolve().then(condition).then(val => {
				if (typeof val !== 'boolean') {
					throw new TypeError('Expected condition to return a boolean');
				}

				if (val === true) {
					resolve();
				} else {
					setTimeout(check, interval);
				}
			}).catch(err => {
				reject(err);
			});
		};

		check();
	});

	if (opts && opts.timeout && typeof opts.timeout === 'number') {
		return pTimeout(promise, opts.timeout);
	}

	return promise;
};
