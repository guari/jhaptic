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
 * Defines a 'haptic behavior': a series of effects {Effect} that can be applied to the web page,
 * the effects will be played in order, from the first element in the array to the last item,
 * taking care of effects life cycle that depends on the events set;
 * @param {Array<Effect>} chain: the array containing the effects that make the behavior;
 * @author Andrea Guarinoni
 */
jhaptic.Behavior = function(chain) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _chain = new Array();
	var _isActive = new Boolean(false);
	var _startup = { element: null, event: null };
	var _boundPlayBehavior, _boundSwitchEffect = undefined;
	var _monitoredEvent;
	var _iteration = undefined, _remainingIteration = undefined;
	
	// Checks if the argument passed is a valid Array<Effect> and then stores it:
	if (chain !== undefined) {
		if (chain instanceof Array){
			if (chain.length != 0){
				for (var i=0; i<chain.length; i++){
					if (!(chain[i] instanceof jhaptic.Effect)) throw new TypeError('{Behavior} constructor: the passed element chain['+i+'] = '+
							chain[i]+' needs to be an {Effect}.');
					if (i == chain.length-1) _chain = chain;
				}
			}
			else throw new Error('The array passed to {Behavior} constructor contains no {Effect}.');
		}
		else throw new TypeError('The parameter passed ['+chain+'] to {Behavior} constructor is not an {Array}.');
	}
	else{
		throw new ReferenceError('{Behavior} constructor is called without passing the expected parameter.');
	}
	
	/*Private method:--------------------------------------------------------------------------------------------*/
	/**
	 * Shows messages on the message box of JHaptic console when log function is active;
	 * @param {String} cmd: the command to use;
	 * @param {String} arg: the message to be displayed;
	 * @private
	 */
	function showMessage(cmd, arg){
		if ((cmd=="log" || cmd=="warn" || cmd=="error" || cmd=="inspect") && window.console[cmd]){
			window.console[cmd](arg);
		}
	}
	
	/**
	 * Starts playing the behavior by enabling the first effect found into the chain;
	 * @param {Device} device;
	 */
	function playBehavior(device){
		// ensures that the effects into the chain are not already registered into the web page
		// (otherwise the effect chain can not be guaranteed),
		// if an effect already enabled is found, throws a warning message and disables the previous registration:
		for (var i=0; i<_chain.length; i++){
			if (_chain[i].getStatus() == true){
				showMessage("warn", "Warning: the effect"+(chain[i].name ? "<i> "+chain[i].name+"</i>" : "")+
					" with "+_chain[i].toString()+" is already registered on the web page.");
				_chain[i].disable(device);
			}
		}
		// resets the iteration counter:
		_remainingIteration = _iteration;
		// starts the chain by enabling the first effect:
		showMessage("log", "The behavior"+(this.name ? "<i> "+this.name+"</i>" : "")+
					" with "+_chain.length+" effects is started"+
				(_boundPlayBehavior? (" because the event '"+
					_startup.event+"' has been fired on the "+_startup.element.toString()+"."):("."))+
					" It will be iterated "+ (_iteration ? _iteration : "infinite")+" times.");
		_chain[0].enable(device);
	}
	
	/*Privileged methods:----------------------------------------------------------------------------------------*/
	/**
	 * Gets the status of the behavior on the web page:
	 */
	this.getStatus = function(){
		return _isActive;
	}
	
	/**
	 * @returns {Object} the couple (element, event) that starts the behavior;
	 */
	this.getStartupParam = function(){
		return _startup;
	}
	
	/**
	 * @param {HTMLElement} element: (Haptically Active Area) the html element on which the event passed will start
	 * 								 the behavior (eg: window, document, document.getElementById('sampleId'),...);
	 * @param {String} event: the event that starts the behavior
	 * 						  (eg: 'click', 'mousemove', 'keypress', 'focus', 'submit'...or a custom event);
	 */
	this.setStartupParam = function(element, event){
		if (this.getStatus() == false){
			_startup.element = element;
			_startup.event = event;
		}
		else showMessage("warn", "Warning: Can't call {Behavior}.setStartupParam() when the behavior"+
				(this.name ? "<i> "+this.name+"</i>" : "")+" is already enabled, " +
					"disable the behavior and then change the startup parameters. The current command will be ignored.");
	}
	
	/**
	 * Registers the behavior to the web page, the life cycles and the activations of the effects 
	 * that make the behavior will be handled automatically based on the parameters set
	 * (if startup parameters are not set the behavior will start as soon as this method is called);
	 * @param {Device} device: current device;
	 * @param {String} mode: "chainOnStop" || "chainOnRemove";
	 * @param {Number} iteration: the number of times that the behavior has to be iterate 
	 *                            once started (iteration = undefined: infinite iteration,
	 *                            iteration = 0: no iteration, the chain will be played one times
	 *                            once started, iteration = 1: one iteration, so two cycle loop);
	 */
	this.enable = function(device, mode, iteration){
		if (device instanceof jhaptic.Device){
			if (device.hasBeenInitialized() == true){
				// if the behavior isn't already registered in the page DOM:
				if (this.getStatus() == false){
					switch (mode){
					case "chainOnStop":
						_monitoredEvent = "effectPlaybackEnded";
						break;
					case "chainOnRemove":
						_monitoredEvent = "effectPlaybackRemoved";
						break;
					default:
						throw new TypeError("Invalid <mode> parameter passed to {Behavior}.enable() method." +
								" Accepted values are 'chainOnStop', 'chainOnRemove'.");
					}
					if (iteration != undefined) {
						if (!isNaN(iteration) && iteration >= 0 && iteration % 1 == 0){
							_iteration = _remainingIteration = iteration;
						}
						else throw new TypeError("Invalid <iteration> parameter passed to {Behavior}.enable() " +
								"method. The value need to be undefined (for infinite iterations) or an integer >= 0.");
					}
					// Register the behavior into the web page:
					_isActive = new Boolean(true);
					// if startup parameters are defined, start the behavior when _startup.event
					// is fired on _startup.element:
					if (_startup.element != null && _startup.event != null){
						_boundPlayBehavior = playBehavior.bind(this, device);
						_startup.element.addEventHandler(_startup.event, _boundPlayBehavior);
						showMessage("log", "Registered a new behavior"+(this.name ? "<i> ("+this.name+")</i>" : "")+
								" on the page with "+_chain.length+" effects and mode='"+
								mode+"'. The behavior will start when the event '"+
								_startup.event+"' will be fired on the "+_startup.element.toString()+
										" and will be iterated "+ (_iteration ? _iteration : "infinite")+" times.");
					}
					else {
						// if startup parameters are not defined, start the behavior immediately:
						playBehavior.call(this, device);
					}				
					// if a stopped/removed effect event is fired enable the next effect found in the chain:
					// (we need to store a reference to the function, in this way we are able to
					// remove the listener when it is no longer necessary)
					_boundSwitchEffect = function() {
						var i=0;
						// check if the effect stopped/removed is into _chain, if yes, then enable the next effect:
						// (eventData will contain a reference to the effect instance that has fired the event)
						while (i<_chain.length && _chain[i]!=arguments[0].eventData){
							i++;
						}
						if (i+1 < _chain.length) _chain[i+1].enable(device);
						// if the effect stopped/removed is into _chain and it's the last one,
						// re-enable the first one if we have to iterate:
						else if (i+1 == _chain.length && (_remainingIteration != undefined ?
								_remainingIteration>0 : true)){
							if (_remainingIteration != undefined) _remainingIteration--;
							_chain[0].enable(device);
						}
					}.bindAsEventListener(this);
					document.getElementById('hapticDiv').addEventHandler(_monitoredEvent, _boundSwitchEffect);
					
				}
				else showMessage("warn", "Warning: Can't call {Behavior}.enable() when the behavior"+
						(this.name ? "<i> "+this.name+"</i>" : "")+" is already enabled. " +
				"The current command will be ignored.");
			}
			else{
				showMessage("error", "Error: Can't call {Behavior}.enable() method when device is not initialized, use {Device}.init() " +
						"to start your device first, then use {Device}.startRenderer() to render the haptic effects on device.");
			}
		}
		else throw new TypeError("{Behavior}.enable() method: the first argument passed need to be a {Device}.");
	}
	
	/**
	 * Unregisters the behavior from the web page;
	 */
	this.disable = function(){
		if (this.getStatus() == true){
			// remove the listeners:
			document.removeEventHandler(_monitoredEvent, _boundSwitchEffect);
			boundSwitchEffect = undefined;
			if (_boundPlayBehavior != undefined){
				_startup.element.removeEventHandler(_startup.event, _boundPlayBehavior);
				_boundPlayBehavior = undefined;
			}
			_isActive = new Boolean(false);
			showMessage("log", "Unregistered the behavior"+(this.name ? "<i> "+this.name+"</i>" : "")+
					" with "+_chain.length+" effects from the page.");
		}
		else showMessage("warn", "Warning: The behavior"+(this.name ? "<i> "+this.name+"</i>" : "")+" is already disabled. " +
		"The current command will be ignored.");
	}
	
}

jhaptic.Behavior.prototype.name;