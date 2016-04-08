define('toolkit-common/microevent/microevent', function() {
	/**
	 * MicroEvent - to make any js object an event emitter (server or browser)
	 *
	 * - pure javascript - server compatible, browser compatible
	 * - dont rely on the browser doms
	 * - super simple - you get it immediatly, no mistery, no magic involved
	 *
	 * - create a MicroEventDebug with goodies to debug
	 *   - make it safer to use
	*/
	var _slice = Array.prototype.slice;

	var MicroEvent	= function(){};
	MicroEvent.prototype	= {
		bind: function(event, callback) {
			var _this = this;
			_this._events = _this._events || {};

			Array.forEach(event.split(/\s+/), function(e) {
				_this._events[e] = _this._events[e] || [];
				_this._events[e].push(callback);
			});

			return _this;
		},

		unbind: function(event, callback) {
			var _this = this;
			_this._events = _this._events || {};

			Array.forEach(event.split(/\s+/), function(e) {
				if( e in _this._events === false  ) {
					return;
				}

				if(callback) {
					var index = _this._events[e].indexOf(callback);
					if ( index != -1 ) {
						_this._events[e].splice(index, 1);
					}
				} else {
					delete _this._events[e];
				}
			});

			return _this;
		},

		trigger: function(event /* , args... */) {
			var _this = this;
			_this._events = _this._events || {};

			var params = _slice.call(arguments, 1);

			window.setTimeout(function() {
				Array.forEach(event.split(/\s+/), function(e) {
					if( e in _this._events === false  ) {
						return;
					}

					var callback, context;

					for(var i = 0; i < _this._events[e].length; i++){
						callback = _this._events[e][i];

						if( typeof callback == "object" ) {
							if( !("handleEvent" in callback) ) {
								continue;
							}

							context = callback;
							callback = callback.handleEvent;
						} else {
							context = _this;
						}

						callback.apply(context, [{ target: _this, type: e }].concat(params));

					}

				});

			}, 0);

			return _this;
		}
	};

	// alias for trigger
	MicroEvent.prototype.on   = MicroEvent.prototype.bind;
	MicroEvent.prototype.off  = MicroEvent.prototype.unbind;
	MicroEvent.prototype.emit = MicroEvent.prototype.trigger;

	/**
	 * mixin will delegate all MicroEvent.js function in the destination object
	 *
	 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
	 *
	 * @param {Object} destObject the object which will support MicroEvent
	 * @param {boolean} forceToFunction use function as object - and do not touch prototype
	*/
	MicroEvent.mixin = function(destObject, forceToFunction) {
		var props = ['bind', 'unbind', 'trigger', 'emit', 'on', 'off'];

		if ( destObject instanceof Function && !forceToFunction ) {
			destObject = destObject.prototype;
		}

		for ( var i = 0 ; i < props.length ; i++ ) {
			destObject[props[i]] = MicroEvent.prototype[props[i]];
		}
	};

	// export in common js
	//if( typeof module !== "undefined" && ('exports' in module)){
	//	module.exports	= MicroEvent;
	//}

	return MicroEvent;
});
