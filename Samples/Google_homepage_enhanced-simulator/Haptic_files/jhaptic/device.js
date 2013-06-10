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
 * Defines a Device object, this a singleton object, so it'll allow only one instance;
 * @param (optional){HTMLEmbedElement} a reference to the haptic plugin that may be used,
 * 					     the plugin must implement the correct interface, if no reference is given
 * 					     the {Device} object tries to load automatically a supported plugin;
 * @author Andrea Guarinoni
 */
jhaptic.Device = function(){
	/**
	/ @constructor:
	*/
	// Ensures it will be a singleton by restricting instantiation of this 'class' to one object:
	if ( arguments.callee._singletonInstance )
	    return arguments.callee._singletonInstance;
	  arguments.callee._singletonInstance = this;

	/*Private variables:------------------------------------------------------------------------------------------------*/
	// Device position related variables:
	var _currentPosition = new jhaptic.Vector(0,0,0); 
	var _oldPosition = new jhaptic.Vector(0,0,0);
	var _currentSpeed = new jhaptic.Vector(0,0,0);
	var _oldSpeed = new jhaptic.Vector(0,0,0);
	var _currentAcceleration = new jhaptic.Vector(0,0,0);
	// buffer of current Effects that have to be rendered (Array<Effect>):
	var _effectBuffer = new Array ();
	// delta(t) used to playback the force feedback computed [measured in ms]:
	var _samplingTime = new Number(1);
	// this will contain a reference to the haptic plugin loaded:
	var _plugin = arguments[0];
	// these are physical device related properties:
	var _maxSupportedForce = new Number();
	var _workspacePixelWidth = new Number();
	var _workspaceSize = new jhaptic.Vector(0,0,0);
	// to choose context type:
	// '2d' uses haptic device coordinates and moves mouse cursor
	//      when the user changes the position of the end-effector,
	//      it allows to handle a classic web page navigation enriched with
	//      multiple haptic effects;
	// '3d' uses haptic device coordinates and can be used to handle
	//      haptic effects in tridimensional application (eg: WebGL):
	var _context = "3d";
	// and the following are related to the haptic rendering loop:
	var _hapticRendererIsActive = new Boolean(false);
	var _hapticLoop;
	var _timeElapsed = new Number(0);
	// this is related to the debug mode:
	var _messageLog = new Boolean(false);
	// these will be used to monitor the real refresh
	// rate of the device when rendering loop is active
	// (to know if the browser doesn't manage to handle the _samplingTime set),
	// speed and acceleration values are
	// calculated according to this time interval:
	var _lastRefreshTime = undefined, _realRefreshInterval = undefined;
	// this will contain a reference to jhaptic console if enabled:
	var _console;
	// In order to maintain acceptable performance
	// jhaptic console will be updated with a rate different
	// from device refresh interval:
	var _consoleRefreshInterval = new Number(50); // milliseconds
	var _lastLogTime = {};
	for (var i=0, labels=['position', 'speed', 'acceleration', 'force', 'graph', 'context', 'deviceRefresh', 'forceInput'], currTime=new Date().getTime(); i<labels.length; i++){
		// initialize _lastLogTime:
		_lastLogTime[labels[i]] = currTime;
	}
	// finally initialize the effect used to limit the cursor movements
	// into browser window:
	var _windowWallsEffect = new jhaptic.Effect(new jhaptic.VirtualWall(), 0);
	_windowWallsEffect.setStartupParam(window, "mouseoutside");
	_windowWallsEffect.setStopParam(window, "mouseinside");
	var _inOutWindow;
	
	// Here we try to load a supported haptic plugin installed in user's browser:
	contentLoaded(window, function(){
		// Once the page DOM is loaded (before that the window.onload is fired):
		_plugin = loadPlugin();
		// and gets the properties of the device:
		_maxSupportedForce = new Number(_plugin.maxForce);
		_workspaceSize.setVector(_plugin.workspaceSize.toVector());
		// then calculates the width of a pixel on the screen related to physical device workspace [measured in Meters]:
		// (_workspacePixelWidth is the shift (in meters) of the end effector in the physical 
		// workspace to which corresponds a shift of one pixel on the desktop screen,
		// the desktop will be vertically centered to fit the height and width of the physical workspace)
		_workspacePixelWidth = _workspaceSize.getX() / window.screen.width;		//	[m/pixel]
		// checks if the height exceeds the size of the physical workspace, if yes then recalculates the value for _workspacePixelWidth:
		if (_workspaceSize.getY() < (window.screen.height * _workspacePixelWidth) ){
			_workspacePixelWidth = _workspaceSize.getY() / window.screen.height;
		}
		}.bind(this));
	
	/* Private methods:-----------------------------------------------------------------------------------------------------*/
	/**
	 * Tries to load a supported haptic plugin.
	 * (The haptic plugin MUST implement and expose these methods and variables:
	 * __________to control the haptic device:__________
	 * - void startDevice();
	 * - void stopDevice();
	 * - void sendForce(double[3]);
	 * - double[3] position;
	 * - boolean initialized;
	 * _____to identify device workspace properties:_____
	 * - double maxForce;
	 * - double[3] workspaceSize;
	 * _____optional, if supported by the real device:____
 	 * - double[3] getForceInput();
	 * ___________to set the working context:___________ 
	 * - void setContext(string);
	 * (the last method is necessary due to the fact that we cannot
	 * set mouse cursor position from javascript, it would be a strong security issue.))
	 * @returns {HTMLEmbedElement} A reference to the plugin successfully loaded;
	 */
	function loadPlugin(){
			var pluginReference;
		// Creates the special node 'hapticDiv' in webpage DOM,
		// we will use it as target to fire/listen all the events used by the library
		// and as a container for the DOM structure of the console if enabled:
			var newDiv = document.createElement("div");
			newDiv.setAttribute("id", "hapticDiv");
			document.body.appendChild(newDiv);
		// if a custom plugin reference is not provided by the user:
			if (_plugin === undefined){
			// loads the npapi plugin into the webpage DOM:
				var newPluginObject = document.createElement("embed");
				newPluginObject.setAttribute('type', 'application/x-haptic');
				newPluginObject.setAttribute('id','pluginobj');
				newPluginObject.setAttribute('width', 0);
				newPluginObject.setAttribute('height', 0);
				document.getElementById("hapticDiv").appendChild(newPluginObject);
			// Catches plugin reference from the DOM:
				pluginReference = document.getElementById("pluginobj");
			}
			else {
				pluginReference = _plugin;
			}
		// Checks if the methods/variables interfaced by the plugin loaded are correct:
			try{
				with (pluginReference){
					startDevice;
					stopDevice;
					initialized;
					position;
					sendForce;
					maxForce;
					workspaceSize;
					setContext;
				}
			}
			catch(error){
				if (error){
					alert("Unable to load a valid haptic plugin, please make sure you have properly installed a supported one. \n\n"+error);
					throw new ReferenceError("InvalidHapticPluginException: "+error);
				}
			}
			finally{
				return pluginReference;
			}
	}
	
	/**
	 * Cross-browser wrapper for DOMContentLoaded
	 * License: MIT
	 * http://javascript.nwbox.com/ContentLoaded/
	 * @param win: window reference;
	 * @param fn: function reference;
	 */
	function contentLoaded(win, fn) {
	    var done = false, top = true,
	    doc = win.document, root = doc.documentElement,
	    add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
	    rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
	    pre = doc.addEventListener ? '' : 'on',

	    init = function(e) {
	        if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
	        (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
	        if (!done && (done = true)) fn.call(win, e.type || e);
	    },

	    poll = function() {
	        try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
	        init('poll');
	    };

	    if (doc.readyState == 'complete') fn.call(win, 'lazy');
	    else {
	        if (doc.createEventObject && root.doScroll) {
	            try { top = !win.frameElement; } catch(e) { }
	            if (top) poll();
	        }
	        doc[add](pre + 'DOMContentLoaded', init, false);
	        doc[add](pre + 'readystatechange', init, false);
	        win[add](pre + 'load', init, false);
	    }
	}
	
	/**
	 * Shows informations on JHaptic console when log function is active;
	 * @param {String} cmd: the command to use;
	 * @param {String} arg: the message to be displayed;
	 */
	function showMessage(cmd, arg){
		// display messages on the message box of JHaptic console and, if available, on the native console:
		if ((cmd=="log" || cmd=="warn" || cmd=="error" || cmd=="inspect") && window.console[cmd]){
			window.console[cmd](arg);
		}
		else {
			// update device related values only on JHaptic console:
			if (_messageLog == true){
				var currentTime = new Date().getTime();
				var delta = currentTime - _lastLogTime[cmd];
				if (delta >= _consoleRefreshInterval){
					_lastLogTime[cmd] = currentTime;
					_console.log(cmd, arg);
				}
			}
		}
	}
	
	/**
	 * Resets variables related to the device position, if necessary;
	 */
	function reset(){
		// resets device position related variables:
		_oldPosition.set(0,0,0);
		_currentPosition.set(0,0,0);
		_oldSpeed.set(0,0,0);
		_currentSpeed.set(0,0,0);
		_currentAcceleration.set(0,0,0);
		// and flushes the playback buffer:
		_effectBuffer = new Array();
	}
	
	/**
	 * Calculates proxy speed;
	 * @private
	 */
	function calcSpeed(){
		// Saves the pointer speed previously calculated and then stores the new one:
		_oldSpeed.setVector(_currentSpeed);
        // (cursor moved to left -> negative x in speed; cursor moved to right -> positive x in speed;
        //  cursor moved upwards -> negative y in speed; cursor moved downwards -> positive y in speed;
        //  cursor moved closer -> negative z in speed; cursor moved away -> positive z in speed;)
		_currentSpeed.setVector((_currentPosition.minus(_oldPosition)).dividedByScalar(_realRefreshInterval));
		showMessage("speed", _currentSpeed.toString());
	}
	
	/**
	 * Calculates proxy acceleration;
	 * @private
	 */
	function calcAcceleration(){
		_currentAcceleration.setVector((_currentSpeed.minus(_oldSpeed)).dividedByScalar(2*_realRefreshInterval));
		showMessage("acceleration", _currentAcceleration.toString());
	}
	
	/**
	 * Calculates the current real refresh interval of the rendering loop;
	 * @private
	 */
	function calcRealRefreshInterval(){
		var currentTime = new Date().getTime();
		_realRefreshInterval = currentTime - _lastRefreshTime;
		_lastRefreshTime = currentTime;
		showMessage("deviceRefresh", _realRefreshInterval);
	}
	
	/**
	 * Fires a 'mouseinside' event when the cursor enters
	 * into the browser window;
	 * @param {Event} e;
	 */
	function onMouseover(e){
		e = e ? e : window.event;
		var from = e.relatedTarget || e.toElement;
		if (_inOutWindow != "in") {
		// create and fire a custom 'mouseinside' event:
		window.fireEvent('mouseinside');
		_inOutWindow = "in";
		}
	}
	
	/**
	 * Fires a 'mouseoutside' event when the cursor leaves
	 * the browser window;
	 * @param {Event} e;
	 */
	function onMouseout(e){
		e = e ? e : window.event;
		var from = e.relatedTarget || e.toElement;
		if (from == null) {
		// create and fire a custom 'mouseoutside' event:
		window.fireEvent('mouseoutside');
		_inOutWindow = "out";
		}
	}
	
	/*Privileged methods:----------------------------------------------------------------------------------------------*/
	/**
	 * Sends a StartDevice command to the haptic device using plugin api.
	 */
	this.init = function(){
		if (this.hasBeenInitialized()==true){
			showMessage("warn", "Warning: Device is already started!");
		}
		else {
			// starts the real/virtual device connected:
			_plugin.startDevice();
			// and define the working context 
			// (in case the user forgets to do it):
			_plugin.setContext(_context);
			showMessage("log", "Device started.");
		}
	}
	
	/**
	 * Sends a StopDevice command to the haptic device using plugin's api.
	 */
	this.stop = function(){
		if (this.hasBeenInitialized()==true){
			// stop real/virtual device:
			_plugin.stopDevice();
			// and reset device properties:
			/*_maxSupportedForce = new Number();
			_workspaceSize = new Vector();*/
			if (_hapticRendererIsActive == true){
				clearInterval(_hapticLoop);
				_hapticRendererIsActive = false;
			}
			showMessage("log", "Device stopped.");
		}
		else {
			showMessage("warn", "Warning: Device is already stopped!");
		}
	}
	
	/**
	 * Checks the current status of the haptic device using plugin's api.
	 * @return {Boolean} true -> device initialized, false -> device not started;
	 */
	this.hasBeenInitialized = function(){
		return _plugin.initialized;
	}
		
	/**
	 * Reads the position of the haptic device using plugin's api.
	 * @returns {Vector} pos: the current position of the pointer [in Meters];
	 * @throws deviceNotInitializedException;
	 */
	this.getPosition = function(){
		if (this.hasBeenInitialized()==true){
			// we need to use another variable different from _currentPosition
			// because if it happens that the user directly calls this method he would
			// generate a small decoupling with the values calculated in the rendering loop
			// and even if it's not strictly necessary, we want that this method will be
			// callable also when rendering loop is not active:
			var pos = new jhaptic.Vector(0,0,0);
			if (_context == "2d"){
				// Receives haptic pointer coordinates (in meters with [0,0,0] corresponding to the
				// mapped upper-left corner of the screen and half depth on z axis):
				pos.setVector(_plugin.position.toVector());
				// and translates them to page reference system ([0,0,z] upper-left corner of the page
				// (page scrolling offset included):
				var windowBorder = (window.outerWidth - window.innerWidth)/2;
				var statusBar = 0;
				if (document.getElementById("status-bar"))
					if (document.getElementById("status-bar").boxObject.height)
						statusBar = document.getElementById("status-bar").boxObject.height;
				var xOffset = (window.screenLeft + windowBorder - window.pageXOffset) * _workspacePixelWidth;
				var yOffset = (window.screenTop + window.outerHeight - window.innerHeight - windowBorder - statusBar - window.pageYOffset) * _workspacePixelWidth;
				pos.setX(pos.getX() - xOffset);
				pos.setY(pos.getY() - yOffset);
			}
			else if (_context == "3d"){
				// Receives haptic pointer coordinates:
				pos.setVector(_plugin.position.toVector());
			}
		}
		else {
			showMessage("error", "Error: Can't call {Device}.getPosition() method when device is not started, use {Device}.init() to start your device.");
			throw "deviceNotInitializedException";
		}
		if (pos) showMessage("position", pos.toString());
		return pos;
	}
	
	/**
	 * Gets the current proxy speed;
	 * @returns {Vector} currentSpeed: the current speed of the pointer;
	 * @throws "rendererNotStartedException";
	 */
	this.getSpeed = function(){
		if (_hapticRendererIsActive == true){
			return _currentSpeed;
		}
		else{
			showMessage("error", "Error: Can't call {Device}.getSpeed() method when the haptic rendering loop is not running," +
					"use {Device}.startRenderer() first.");
			throw "rendererNotStartedException";
		}
	}
	
	/**
	 * Gets the current proxy acceleration;
	 * @returns {Vector} currentAcceleration: the current acceleration of the pointer
	 * @throws "rendererNotStartedException";
	 */
	this.getAcceleration = function(){
		if (_hapticRendererIsActive == true){
			return	_currentAcceleration;
		}
		else{
			showMessage("error", "Error: Can't call {Device}.getAcceleration() method when the haptic rendering loop is not running," +
			"use {Device}.startRenderer() first.");
			throw "rendererNotStartedException";
		}
	}
	
	/**
	 * Reads the current force input on the haptic pointer using plugin's api.
	 * @returns {Vector} force: the current force exerted by the user [in Newton];
	 * @throws deviceNotInitializedException;
	 */
	this.getForceInput = function(){
		var forceInput = new jhaptic.Vector(0,0,0);
		if (this.hasBeenInitialized()==true){
			// the force input sensor could be not available on some device,
			// in those case the force returned will be zero:
			if (_plugin.getForceInput) forceInput = _plugin.getForceInput().toVector();
		}
		else {
			showMessage("error", "Error: Can't call {Device}.getForceInput() method when device is not started, use {Device}.init() to start your device.");
			throw "deviceNotInitializedException";
		}
		showMessage("forceInput", forceInput.toString());
		return forceInput;
	}
	
	/**
	 * Gets the current real refresh interval of the rendering loop
	 * that, depending on client pc performance, could be greater than
	 * the _samplingTime set; 
	 * @returns {Number} refreshInterval;
	 */
	this.getRealRefreshInterval = function(){
		return _realRefreshInterval;
	}
	
	/**
	 * Sends a SendForce command to the haptic device using plugin's api.
	 * @param {Vector} forceVector: force vector to be rendered;
	 */
	this.sendForce = function(forceVector){
		if (this.hasBeenInitialized()==true){
			// ensures that the force value doesn't exceed the hardware limits of the device:
			forceVector.setVector(forceVector.getLimitedByMagnitude(_maxSupportedForce));
			// sends force values to be rendered to the haptic device, values are measured in Newton:
			_plugin.sendForce(forceVector.toString());
			// send force log, if debug console is not activated showMessage() do nothing:
			showMessage("force", forceVector.toString());
			showMessage("graph", forceVector.toString());
		}
		else {
			showMessage("error", "Error: Can't call {Device}.sendForce() method when device is not started, use {Device}.init() to start your device.");
			throw "deviceNotInitializedException";
		}
	}
	
	/**
	 * Gets the max force playable by the haptic device connected and initialized;
	 * @returns {Number};
	 */
	this.getMaxSupportedForce = function(){
		return _maxSupportedForce;
	}
	
	/**
	 * Gets the width of a pixel calculated according to the physical workspace of the haptic device;
	 * @returns {Number};
	 */
	this.getPixelWidth = function(){
		return _workspacePixelWidth;
	}
	
	/**
	 * Enables the showing of log messages for debug;
	 * @throws "consoleAlreadyEnabledException";
	 */
	this.enableConsoleLog = function(){
		if (_messageLog == false){
			// create a new jhaptic console for showing log messages:
			_console = new jhaptic.Console();
			// Once the page DOM is loaded (before that the window.onload is fired):
			contentLoaded(window, function(){
				// build DOM structure for console and display it on page:
				_console.enable((_consoleRefreshInterval>_samplingTime? _consoleRefreshInterval : _samplingTime), 
						_maxSupportedForce, _workspaceSize, _workspacePixelWidth);
				// finally create and set the global status variable to true:
				window.jhaptic.consoleIsEnabled = true;
				_messageLog = true;
				_console.log("context", _context);
			}.bind(this));
		}
		else throw "consoleAlreadyEnabledException";
	}
		
	/**
	* Disables log messages for debug;
	*/
	this.disableConsoleLog = function(){
		if (_messageLog == true){
			_console.disable();
			// and set the global status variable to false:
			window.jhaptic.consoleIsEnabled = false;
			_messageLog = false;
		}
		else throw "consoleAlreadyDisabledException";
	}
	
	/**
	 * Gets the current active context;
	 * @returns {String} context;
	 */
	this.getContext = function(){
		return _context;
	}
	
	/**
	 * Sets the context in which the library will work;
	 * @param {String} context: possible value are:
	 *                         '2d' - uses haptic device coordinates and moves mouse cursor
	 *                         when the user changes the position of the end-effector,
	 *                         it allows to handle a classic web page navigation enriched with
	 *                         multiple haptic effects;
	 *                         '3d' - uses haptic device coordinates and can be used to handle
	 *                         haptic effects in tridimensional application (eg: WebGL):
	 */
	this.setContext = function(context){
		if (this.hasBeenInitialized()==true){
			if (context == "2d" ||  context =="3d"){
				if (_context != context){
					reset.call(this);
					_context = context;
					_plugin.setContext(_context);
					showMessage("log", "Enabled '" + _context + "' working context.");
					showMessage("context", _context);
					switch (_context) {
						case "2d":
							// registers the handlers to check when browser window is left:
							window.addEventHandler('mouseover', onMouseover);
							window.addEventHandler('mouseout', onMouseout);
							// registers the effect used to limit the cursor movements into 
							// the browser window space:
							_windowWallsEffect.enable(this);
							break;
						case "3d":
							// removes the effect used to limit the cursor movements into 
							// the browser window space:
							_windowWallsEffect.disable(this);
							// and the listener used to know when the cursor leave the window:
							window.removeEventHandler('mouseover', onMouseover);
							window.removeEventHandler('mouseout', onMouseout);
							break;
					}
				}
			}
			else showMessage("The Context "+context+" is not a valid identifier, admitted values are '2d', '3d'.");
		}
		else {
			showMessage("error", "Error: Can't call {Device}.setContext() method when device is not started, use {Device}.init() to start your device.");
			throw "deviceNotInitializedException";
		}
	}
	
	/**
	 * Gets the time elapsed since the beginning of the rendering loop;
	 * @return {Number} timeElapsed: [ms]
	 */
	this.getTimeElapsed = function(){
		return _timeElapsed;
	}
	
	/**
	 * Sets the time elapsed since the beginning of the rendering loop;
	 * @param {Number} timeElapsed: [ms]
	 */
	this.setTimeElapsed = function(time){
		_timeElapsed = Number(time);
	}
	
	/**
	 * Adds a force effect to the playback buffer;
	 * @param {Effect} effect;
	 */
	this.addToEffectBuffer = function(effect){
		// adds 'effect' to _effectBuffer[] only if it isn't already inside:
		if (_effectBuffer.indexOf(effect)==-1){
			_effectBuffer.push(effect);
			// send a log message to jhaptic console:
			showMessage("log","Started the playback of the effect"+
					(effect.name? "<i> "+effect.name+"</i>" : "")+" with "+effect.toString()+"."+
					(effect.startupHandlerIsActive()? (" The effect is started because the event '"+
						effect.getStartupParam().event+"' has been fired on the "+effect.getStartupParam().element.toString()+"."):("")));
			// then fire the 'effectPlaybackStarted' event:
			document.getElementById('hapticDiv').fireEvent('effectPlaybackStarted', effect);
		}
	}
	
	/**
	 * Removes a force effect from the playback buffer;
	 * @param {Effect} effect;
	 */
	this.removeFromEffectBuffer = function(effect){
		// if the effect is inside _effectBuffer:
		if (_effectBuffer.indexOf(effect)!=-1){
			// remove 'effect' from _effectBuffer[]:
			// (it could be out of the 'if' block, it's here because we need
			// to remove it before firing the appropriate event)
			_effectBuffer.removeFromArray(effect);
			// send a log message to jhaptic console:
			showMessage("log","Stopped the playback of the effect"+
					(effect.name? "<i> "+effect.name+"</i>" : "")+" with "+effect.toString()+"."+
					((effect.getTimeout() !=0 && effect.getRemainingTime()<=0)? 
							" The effect has been stopped because the duration timer has expired." : 
								(effect.stopHandlerIsActive()? (" The effect has been stopped because the event '"+
					effect.getStopParam().event+"' has been fired on the "+effect.getStopParam().element.toString()+"."):(""))));
			// then fire the 'effectPlaybackEnded' event:
			document.getElementById('hapticDiv').fireEvent('effectPlaybackEnded', effect);
		}
	}
	
	/**
	 * Starts the haptic loop that runs every '_samplingTime' (1ms) and manages the playback of the force feedback;
	 */
	this.startRenderer = function(){
		if (_hapticRendererIsActive == false){
			if (this.hasBeenInitialized()==true){
				_hapticRendererIsActive = true;
				showMessage("log", "Haptic Renderer started.");
				var _forceBuffer = new jhaptic.Vector(0,0,0);
				// reset _timeElapsed counter:
				this.setTimeElapsed(0);
				// and init _lastRefreshTime:
				_lastRefreshTime = new Date().getTime();
				_hapticLoop = setInterval (function(){
						calcRealRefreshInterval.call(this);
						this.setTimeElapsed(this.getTimeElapsed() + _realRefreshInterval);
						_forceBuffer.set(0, 0, 0);
						_oldPosition.setVector(_currentPosition);
						_currentPosition.setVector(this.getPosition());
						calcSpeed.call(this);
						calcAcceleration.call(this);
						if (_effectBuffer.length != 0){
							for (var index=0; index<_effectBuffer.length; index++ ){
								var model = _effectBuffer[index].getModel();
								// if the force buffer contains a VirtualWall model, renders only that:
								if (model instanceof jhaptic.VirtualWall){
									_forceBuffer.setVector(model.getForce(this));
									index = _effectBuffer.length;
								}
								else {
									// sum all the current forces (superposition of effects):
									_forceBuffer.setVector(_forceBuffer.plus( model.getForce(this)));
								}
							}
						}
						this.sendForce(_forceBuffer);
					}.bind(this), _samplingTime, this);
				// the Function.bind() method is used to correct the scope of the function called,
				// without it the anonymous function declared into setInterval() would be executed
				// in a different scope with 'this'='DOMwindow' and we want 'this'=our device object
			}
			else{
				showMessage("error", "Error: Can't call {Device}.startRenderer() method when device is not initialized, use {Device}.init() to start your device first.");
			}
		}
		else{
			showMessage("warn", "Warning: Only one active rendering loop is allowed!");
		}
	}
		
} 