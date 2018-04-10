'use strict';
const nonBooleanError = new TypeError('Expected condition to return a boolean');

module.exports = (condition, interval) => new Promise((resolve, reject) => {
	interval = typeof interval === 'number' ? interval : 20;

	const check = () => {
		Promise.resolve(condition()).then(val => {
			if (val === true) {
				resolve();
			} else if (val === false) {
				setTimeout(check, interval);
			} else {
				throw nonBooleanError;
			}
		}).catch(reject);
	};

	check();
});
