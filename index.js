'use strict';
module.exports = (condition, interval) => new Promise((resolve, reject) => {
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
		}).catch(reject);
	};

	check();
});
