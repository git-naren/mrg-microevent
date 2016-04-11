define('mrg-microevent', function defineMrgMicroEvent() {
	'use strict';

	var EVENTS = '_events';
	var EVENT = 0;
	var PARAM = 1;

	var isExtraParamsSupported = false;

	window.setTimeout(function (a, b) {
		isExtraParamsSupported = a === 1 && b === 2;
	}, 0, 1, 2);

	function isObject(anything) {
		return Object(anything) === anything;
	}

	function isString(anything) {
		return typeof anything == 'string';
	}

	function isFunction(anything) {
		return typeof anything == 'function';
	}

	function splitBySpaces(string) {
		return string.split(/\s+/);
	}

	function addListener(events, type, listener) {
		var listeners = events[type];

		if (!Array.isArray(listeners)) {
			listeners = [];
			events[type] = listeners;
		}

		if (listeners.indexOf(listener) == -1) {
			listeners.push(listener);
		}
	}

	function removeListener(events, type, listener) {
		var listeners = events[type];

		if (Array.isArray(listeners)) {
			var index = listeners.indexOf(listener);

			if (index != -1) {
				listeners.splice(index, 1);
			}
		}
	}

	function callListener(listener, args) {
		var event = args[EVENT];
		var target = event.target;

		if (!isFunction(listener) && isObject(listener)) {
			var handleEvent = listener.handleEvent;

			if (isFunction(handleEvent)) {
				target = listener;
				listener = handleEvent;
			}
		}

		if (isObject(target) && isFunction(listener)) {
			var argCount = args.length;

			if (argCount == 1) {
				listener.call(target, event);

			} else if (argCount == 2) {
				listener.call(target, event, args[PARAM]);

			} else {
				listener.apply(target, args);
			}
		}
	}

	function callListeners(listeners, args) {
		for (var i = 0, length = listeners.length; i < length; i++) {
			callListener(listeners[i], args);
		}
	}

	function asyncCallListeners(listeners, args) {
		if (window.setImmediate) {
			window.setImmediate(callListeners, listeners, args);

		} else if (isExtraParamsSupported) {
			window.setTimeout(callListeners, 0, listeners, args);
		} else {
			window.setTimeout(function asyncCallListenersOnTimeout() {
				callListeners(listeners, args);
			}, 0);
		}
	}

	function MicroEvent(type) {
		this.type = type;
		this.target = null;
	}

	function EventTarget() {
		this[EVENTS] = {};
	}

	var EventTargetPrototype = EventTarget.prototype;

	EventTargetPrototype.bind = function on(types, listener) {
		var target = this;

		if (isString(types) && isObject(listener)) {
			var events = target[EVENTS];

			if (!isObject(events)) {
				EventTarget.call(target);
				events = target[EVENTS];
			}

			types = splitBySpaces(types);

			for (var i = 0, length = types.length; i < length; i++) {
				addListener(events, types[i], listener);
			}
		}

		return target;
	};

	EventTargetPrototype.unbind = function off(types, listener) {
		var target = this;
		var events = target[EVENTS];

		if (isObject(events) && isString(types) && isObject(listener)) {
			types = splitBySpaces(types);

			for (var i = 0, length = types.length; i < length; i++) {
				var type = types[i];

				if (listener) {
					removeListener(events, type, listener);

				} else {
					delete events[type];
				}
			}
		}

		return target;
	};

	EventTargetPrototype.trigger = function emit(types/* , args… */) {
		var target = this;
		var events = target[EVENTS];

		if (isObject(events) && isString(types)) {
			types = splitBySpaces(types);

			for (var i = 0, length = types.length; i < length; i++) {
				var type = types[i];
				var listeners = events[type];

				if (Array.isArray(listeners)) {
					var event = new MicroEvent(type);
					var j = arguments.length;
					var args = new Array(j);

					while (--j) {
						args[j] = arguments[j];
					}

					event.target = target;
					args[EVENT] = event;
					asyncCallListeners(listeners, args);
				}
			}
		}

		return target;
	};

	EventTargetPrototype.on = EventTargetPrototype.bind;
	EventTargetPrototype.off = EventTargetPrototype.unbind;
	EventTargetPrototype.emit = EventTargetPrototype.trigger;

	/**
	 * @param   {Object}  target
	 * @param   {Boolean} [defineStatic]
	 * @returns {Object}  target
	 */
	EventTarget.mixin = function mixin(target, defineStatic) {
		if (target instanceof Function && !defineStatic) {
			target = target.prototype;
		}

		var methods = ['bind', 'unbind', 'trigger', 'emit', 'on', 'off'];

		for (var i = 0, length = methods.length; i < length; i++) {
			var methodName = methods[i];

			target[methodName] = EventTargetPrototype[methodName];
		}
	};

	return EventTarget;
});
