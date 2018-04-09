'use strict';
const nonBooleanError = new TypeError('Expected condition to return a boolean');

module.exports = (condition, interval) => {
	interval = typeof interval === 'number' ? interval : 20;

	return new Promise((resolve, reject) => {
		const check = () => {
			Promise.resolve(condition()).then(val => {
				if (val === true) {
					resolve();
				} else if (val === false) {
					setTimeout(check, interval);
				} else {
					throw nonBooleanError;
				}
			}, reject);
		};

		check();
	});
};
