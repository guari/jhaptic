/**
This file is part of JHaptic.

    JHaptic is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    JHaptic is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with JHaptic.  If not, see <http://www.gnu.org/licenses/>.

    Copyright 2012 Politecnico di Milano
*/

/**
 * Define an haptic effect as a force mathematical model associated with a playback duration;
 * @param {ForceModel} model: force mathematical model;
 * @param {Number} timeout: the duration of the haptic effect once started [milliseconds]
 * 							(0 -> the effect has no timeout and runs until it is not removed);
 * @throws 'WrongForceModelTypeException', 'WrongTimeoutTypeException', 'NegativeTimeoutException';
 * @author Andrea Guarinoni
 */

jhaptic.Effect = function(model, timeout) {
	/**
	 * @constructor:
	 */
	/*Private variables:----------------------------------------------------------------------------------------*/
	// force mathematical model:
	var _model = null;
	// duration of the haptic effect once started:
	var _timeout = new Number();
	// reference to the timer object when it will be activated:
	var _effectTimer = null;
	// shows if the current effect is already registered on webpage:
	var _isActive = Boolean(false);

	var _boundPlayEffect, _boundStopEffect, _boundRemoveEffect = undefined;

	var _startup = { element: null, event: null };
	var _stop = { element: null, event: null };
	var _removal = { element: null, event: null };
	// used to calculate the remaining duration of the effect playback (ms):
	var _startingTime = null;

	// Performs some consistency checks on the passed values:
	if (model instanceof jhaptic.ForceModel){
		_model = model;
	}
	else throw 'WrongForceModelTypeException';

	if (isNumber(timeout)){
		if (timeout >= 0){
			_timeout = timeout;
		}
		else throw 'NegativeTimeoutException';
	}
	else throw 'WrongTimeoutTypeException';

	/*Private methods:----------------------------------------------------------------------------------------*/
	/**
	 * Controls if the content of a variable is a number;
	 * @param {Object} obj: variable which content we want to verify;
	 * @returns {Boolean} eg. 3->true, "aa"->false, "2"->true;
	 */
	function isNumber(obj) {
		var n = new Number(obj);
		return (!isNaN(n));
		}

	/**
	 * Shows messages on the message box of JHaptic console when log function is active;
	 * @param {String} cmd: the command to use;
	 * @param {String} arg: the message to be displayed;
	 */
	function showMessage(cmd, arg){
		if ((cmd=="log" || cmd=="warn" || cmd=="error" || cmd=="inspect") && window.console[cmd]){
			window.console[cmd](arg);
		}
	}

	/**
	 * Plays the effect passed as scope by adding it into the effectBuffer;
	 * @param {Device} device: current device;
	 * @private
	 */
	function playEffect(device){
		// If the effect isn't already in, put the effect in the playback buffer:
		device.addToEffectBuffer(this);
		// If a timer is set for this effect, if the effect is running reset the timer otherwise start it:
		this.resetTimer(device);
	}

	/**
	 * Stops the playback of the effect passed as scope;
	 * @param {Device} device: current device;
	 * @private
	 */
	function stopEffect(device){
		// If the effect is into _effectBuffer, remove the effect from the playback buffer:
		device.removeFromEffectBuffer(this);
		// If a timer is set for this effect, remove the timer:
		this.stopTimer();
		// If a playEffect handler is not registered, an effect stopped cannot be restarted without
		// recalling the 'enable' method, so in this case, disable the effect when it stops:
		if (_boundPlayEffect == undefined){
			// If there is a removeEffect handler to delete, delete the listener for _remove.event on _remove.element:
			if (_boundRemoveEffect != undefined){
				_removal.element.removeEventHandler(_removal.event, _boundRemoveEffect);
				_boundRemoveEffect = undefined;
			}
			// If there is a stopEffect handler to remove, remove the listener for _stop.event on _stop.element:
			if (_boundStopEffect != undefined){
				_stop.element.removeEventHandler(_stop.event, _boundStopEffect);
				_boundStopEffect = undefined;
			}
			// and finally set the effect status as unregistered from page:
			setStatus.call(this, false);
		}
	}

	/**
	 * Removes the effect passed as scope from the page;
	 * @param {Device} device: current device;
	 * @private
	 */
	function removeEffect(device){
		var rmvActive = this.removalHandlerIsActive();
		// Remove the handler for the removal event (this function):
		if (_boundRemoveEffect != undefined){
			_removal.element.removeEventHandler(_removal.event, _boundRemoveEffect);
			_boundRemoveEffect = undefined;
		}
		// If there is a stopEffect handler to remove, remove the listener for _stop.event on _stop.element:
		if (_boundStopEffect != undefined){
			_stop.element.removeEventHandler(_stop.event, _boundStopEffect);
			_boundStopEffect = undefined;
		}
		// If there is a playEffect handler to remove, remove the listener for _startup.event on _startup.element:
		if (_boundPlayEffect != undefined){
			_startup.element.removeEventHandler(_startup.event, _boundPlayEffect);
			_boundPlayEffect = undefined;
		}
		// And finally if the effect is currently playing, stop it:
		stopEffect.call(this, device);
		// now the effect is unregistered from page:
		setStatus.call(this, false);
		// and send a log message to jhaptic console:
		showMessage("log", "<u>Unregistration:</u> Removed from the page the effect"+(this.name? "<i> "+this.name+"</i>" : "")+
				" with "+this.toString()+"."+(rmvActive? (" The effect has been removed because the event '"+
				_removal.event+"' has been fired on the "+_removal.element.toString()+"."):("")));
		// Then fire the 'effectPlaybackRemoved' event:
		document.getElementById('hapticDiv').fireEvent('effectPlaybackRemoved', this);
	}

	/*Privileged methods:----------------------------------------------------------------------------------------*/
	/**
	 * Gets force model for this effect;
	 * @returns {ForceModel};
	 */
	this.getModel = function(){
		return _model;
	}

	/**
	 * Sets force model for this effect;
	 * @param {ForceModel} model: the force model to set;
	 */
	this.setModel = function(model){
		if (model instanceof jhaptic.ForceModel){
			_model = model;
		}
		else throw 'WrongForceModelTypeException';
	}

	/**
	 * Gets timeout value for this effect;
	 * @returns {Number};
	 */
	this.getTimeout = function(){
		return _timeout;
	}

	/**
	 * Sets timeout value for this effect;
	 * @param {Number} timeout: max duration of effect playback;
	 */
	this.setTimeout = function(timeout){
		if (isNumber(timeout)){
			if (timeout >= 0){
				_timeout = timeout;
			}
			else throw 'NegativeTimeoutException';
		}
		else throw 'WrongTimeoutTypeException';

	}

	/**
	 * Starts the timer for the effect 'this' on the device passed;
	 * @param {Device} device: the device on which starts the playback timer;
	 */
	this.startTimer = function(device){
		// if the effect has to be played with a timer and the timer isn't already started:
		if (_timeout != 0 && _effectTimer == null){
			// starts the timer for this effect:
			_effectTimer = setTimeout( stopEffect.bind(this, device), _timeout, this);
			_startingTime = new Date().getTime();
		}
	}

	/**
	 * Stops the timer for the effect 'this';
	 */
	this.stopTimer = function(){
		// if the effect has to be played with a timer and the timer is already started:
		if (_timeout != 0 && _effectTimer != null){
			// remove the timer for this effect:
			clearTimeout(_effectTimer);
			_effectTimer = null;
			_startingTime = null;
		}
	}

	/**
	 * Reset the timer for the effect 'this';
	 * @param {Device} device;
	 */
	this.resetTimer = function(device){
			this.stopTimer();
			this.startTimer(device);
	}

	/**
	 * Gets the status of the effect on the web page:
	 * @returns {Boolean};
	 */
	this.getStatus = function(){
		return _isActive;
	}

	/**
	 * Set the status of the effect on the web page:
	 * @param {Boolean} status
	 * @private
	 */
	var setStatus = function(status){
		_isActive= Boolean(status);
	}

	/**
	 * @returns {Object} the couple (element, event) that starts the effect playback;
	 */
	this.getStartupParam = function(){
		return _startup;
	}

	/**
	 * @returns {Object} the couple (element, event) that stops the effect playback;
	 */
	this.getStopParam = function(){
		return _stop;
	}

	/**
	 * @returns {Object} the couple (element, event) that removes the effect from the page;
	 */
	this.getRemovalParam = function(){
		return _removal;
	}

	/**
	 * @param {HTMLElement} element: (Haptically Active Area) the html element on which the event passed will start
	 * 								 the haptic effect (eg: window, document, document.getElementById('sampleId'),...);
	 * @param {String} event: the event that starts the playback of the defined haptic effect
	 * 						  (eg: 'click', 'mousemove', 'keypress', 'focus', 'submit'...or a custom event);
	 */
	this.setStartupParam = function(element, event){
		if (this.getStatus() == false){
			_startup.element = element;
			_startup.event = event;
		}
		else showMessage("warn", "Warning: Can't call {Effect}.setStartupParam() when the effect is already enabled, " +
				"disable the effect"+(this.name? "<i>"+this.name+"</i>" : "")+
				" and then change the startup parameters. The current command will be ignored.");
	}

	/**
	 * @param {HTMLElement} element: (Haptically Active Area) the html element on which the event passed will stop
	 * 								 the haptic effect (eg: window, document, document.getElementById('sampleId'),...);
	 * @param {String} event: the event that stops the playback of the defined haptic effect
	 * 						  (eg: 'click', 'mousemove', 'keypress', 'focus', 'submit'...or a custom event);
	 */
	this.setStopParam = function(element,event){
		if (this.getStatus() == false){
		_stop.element = element;
		_stop.event = event;
	}
	else showMessage("warn", "Warning: Can't call {Effect}.setStopParam() when the effect is already enabled, " +
			"disable the effect"+(this.name? "<i>"+this.name+"</i>" : "")+
			" and then change the stop parameters. The current command will be ignored.");
	}

	/**
	 * @param {HTMLElement} element: (Haptically Active Area) the html element on which the event passed will remove
	 * 								 the haptic effect (eg: window, document, document.getElementById('sampleId'),...);
	 * @param {String} event: the event that removes the defined haptic effect from the page
	 * 						  (eg: 'click', 'mousemove', 'keypress', 'focus', 'submit'...or a custom event);
	 */
	this.setRemovalParam = function(element,event){
		if (this.getStatus() == false){
		_removal.element = element;
		_removal.event = event;
	}
	else showMessage("warn", "Warning: Can't call {Effect}.setRemovalParam() when the effect is already enabled, " +
			"disable the effect"+(this.name? "<i>"+this.name+"</i>" : "")+
			" and then change the removal parameters. The current command will be ignored.");
	}

	/**
	 * Get the status of the listener that start the playback of the effect;
	 * @returns {Boolean} true: if the listener has been registered on the page,
	 * 					  false: if doesn't exist a listener that starts the effect;
	 */
	this.startupHandlerIsActive = function(){
		var result = false;
		if (_boundPlayEffect != undefined)	result = true;
		return result;
	}

	/**
	 * Get the status of the listener that stop the playback of the effect;
	 * @returns {Boolean} true: if the listener has been registered on the page,
	 * 					  false: if doesn't exist a listener that stops the effect;
	 */
	this.stopHandlerIsActive = function(){
		var result = false;
		if (_boundStopEffect != undefined)	result = true;
		return result;
	}

	/**
	 * Get the status of the listener that remove the effect from the page;
	 * @returns {Boolean} true: if the listener has been registered on the page,
	 * 					  false: if doesn't exist a listener that removes the effect;
	 */
	this.removalHandlerIsActive = function(){
		var result = false;
		if (_boundRemoveEffect != undefined)		result = true;
		return result;
	}

	/**
	 * @returns {Number} the remaining duration of the effect playback (ms);
	 */
	this.getRemainingTime = function(){
		var result = undefined;
		if (_startingTime != null){
			var currentTime = new Date().getTime();
			result = _timeout - (currentTime - _startingTime);
		}
		return result;
	}

	/**
	 * Registers the haptic effect to the web page, the life cycle of the effect depends on the parameters set
	 * (if startup parameters are not set the effect playback will start as soon as this method is called);
	 * @param {Device} device: current device;
	 */
	this.enable = function(device){
		if (device.hasBeenInitialized() == true){
			// if the effect isn't already registered in the page DOM:
			if (this.getStatus() == false){
				// Add the effect into the web page:
				setStatus.call(this, true);
				// if startup parameters are defined, play the effect when _startup.event
				// is fired on _startup.element:
				if (_startup.element != null && _startup.event != null){
					// Set an handler for startup.event on startup.element,
					// the handler function is called by setting as scope the effect 'this' and
					// passing as parameter the 'device':
					_boundPlayEffect = playEffect.bind(this, device);
					_startup.element.addEventHandler(_startup.event, _boundPlayEffect);
					showMessage("log", "<u>Registration:</u> Added a new effect to the page with "+this.toString()+". The effect"+
							(this.name? "<i> "+this.name+"</i>" : "")+" will start when the event '"+
							_startup.event+"' will be fired on the "+_startup.element.toString()+".");
				}
				else {
					// if startup parameters are not defined, play the effect immediately:
					playEffect.call(this, device);
				}
				// if stop parameters are defined, stop the effect when _stop.event
				// is fired on _stop.element, else do nothing:
				if (_stop.element != null && _stop.event != null){
					// Set an handler for _stop.event on _stop.element,
					// the handler function is called by setting as scope the 'effect' this
					// and passing as parameter the 'device':
					_boundStopEffect = stopEffect.bind(this, device);
					_stop.element.addEventHandler(_stop.event, _boundStopEffect);
					showMessage("log", "<u>Registration:</u> The effect"+(this.name? "<i> "+this.name+"</i>" : "")+" with the "+
							this.toString()+" will be stopped when the event '"+
							_stop.event+"' will be fired on the "+_stop.element.toString()+".");
				}
				// if removal parameters are defined, remove the effect
				// when _removal.event is fired on _removal.widget, else do nothing:
				if (_removal.element != null && _removal.event != null){
					// Set an handler for _removal.event on _removal.element,
					// the handler function is called by setting as scope the 'effect' this
					// and passing as parameter the 'device':
					_boundRemoveEffect = removeEffect.bind(this, device);
					_removal.element.addEventHandler(_removal.event, _boundRemoveEffect);
					showMessage("log", "<u>Registration:</u> The effect"+(this.name? "<i> "+this.name+"</i>" : "")+
							" with the "+this.toString()+" will be removed from the page when the event '"+
							_removal.event+"' will be fired on the "+_removal.element.toString()+".");
				}
			}
			else showMessage("warn", "Warning: Can't call {Effect}.enable() when the effect"+
					(this.name? "<i> "+this.name+"</i>" : "")+" is already enabled. " +
			"The current command will be ignored.");
		}
		else{
			showMessage("error", "Error: Can't call {Effect}.enable() method when device is not initialized, use {Device}.init() " +
					"to start your device first, then use {Device}.startRenderer() to render the haptic effects on device.");
		}
	}

	/**
	 * Unregisters the haptic effect from the web page, as soon as this method is called the effect will be disabled;
	 * @param {Device} device: current device;
	 */
	this.disable = function(device){
		if (this.getStatus() == true){
			removeEffect.call(this, device);
		}
		else showMessage("warn", "Warning: The effect"+(this.name? "<i> "+this.name+"</i>" : "")+" is already disabled. " +
		"The current command will be ignored.");
	}
}

/*Public variable:-------------------------------------------------------------------------------------------*/
/**
 * Optional, used only for debug:
 */
jhaptic.Effect.prototype.name = new String();

/*Public method:------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Effect object;
 * @returns {String} containing Effect parameters;
 */
jhaptic.Effect.prototype.toString = function(){
	return "model: "+this.getModel().toString()+
				(this.getTimeout() == 0 ?
						" and no timeout" : " and a timeout of "+this.getTimeout()+" milliseconds");
}