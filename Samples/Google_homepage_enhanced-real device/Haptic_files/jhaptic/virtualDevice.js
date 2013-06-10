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
 * Defines a virtual device to allow the debugging of an application that uses jhaptic library.
 * It's intended to be used only to test an application without a real device connected.
 * @param {Number}  maxForceOutput: device property to simulate;
 * @param {Vector} workspaceSize: device property to simulate;
 * @author Andrea Guarinoni
 */
jhaptic.VirtualDevice = function(maxForceOutput, workspaceSize){
	/**
	/ @constructor:
	*/
	// default values, used if the user starts the simulator without passing parameter:
	// [3 Newton as max virtual device playable force]:
	var _defaultMaxForce = 3;
	// [160mm Wide x 120mm High x 70mm Deep as physical workspace size]:
	var _defaultWorkspaceSize = new jhaptic.Vector(0.16, 0.12, 0.07);
	// checking parameter type:
	if (maxForceOutput && isNaN(maxForceOutput)) {
		throw new TypeError("VirtualDevice: maxForceOutput parameter must be a Number");
	}
	if (workspaceSize && !(workspaceSize instanceof jhaptic.Vector)) {
		throw new TypeError("VirtualDevice: workspaceSize parameter must be a Vector");
	}
	
	// When inheriting from a singleton object ({Device}) using the prototype module pattern
	// and it's necessary to pass some parameters ({VirtualPlugin} reference) from the derived
	// Object/Function ({VirtualDevice}) to the parent constructor ({Device}), comes out that
	// we have to call at least two times the parent constructor (as if we re-write two times the
	// extended object), first time to create inheritance and second time to pass the parameter:
	// this is impossible being it a singleton!
	// So, I used a sort of wrapping approach, {VirtualDevice}->{VDevice}->{Device},
	// {VDevice} inherits from {Device} but externally it's like '{VirtualDevice} extends {Device}':
	function VDevice(){
		// Ensures it will be a singleton by restricting instantiation of this 'class' to one object:
		if ( arguments.callee._singletonInstance )
		    return arguments.callee._singletonInstance;
		  arguments.callee._singletonInstance = this;
	};
	// create inheritance chain:
	VDevice.prototype = new jhaptic.Device(new jhaptic.VirtualPlugin(Number(maxForceOutput || _defaultMaxForce), (workspaceSize || _defaultWorkspaceSize)));
	VDevice.prototype.constructor = VDevice;
	
	return new VDevice();
}

/**
 * Simulates the behavior of a compatible haptic plugin, it's used to allow
 * the debugging of an application that uses jhaptic library without a physical
 * device connected or a real plugin loaded;
 * @param {Number} maxForceOutput: device property to simulate;
 * @param {Vector} workspaceSize: device property to simulate;
 * @author Andrea Guarinoni
 */
jhaptic.VirtualPlugin = function(maxForceOutput, workspaceSize){
	/**
	/ @constructor:
	*/
	/* Private variables:-----------------------------------------------------------------------------------------------------*/
	// used to store temporary position coordinates:
	var _tempX, _tempY, _tempZ = 0;
	// to handle the working context:
	var _context;
	
	var _alertDisplayed = false;
	
	// to calculates the width of a pixel on the screen related to physical
	// dimensions of the device workspace [measured in Meters]:
	var _workspacePixelWidth;	//	[m/pixel]
	
	/* Private methods:-----------------------------------------------------------------------------------------------------*/
	/**
	 * This is the handler of the 'mousemove' event fired by the browser
	 * whenever mouse moves;
	 * @param {MouseEvent} event
	 * @returns {Boolean}
	 */
	var updateXYPosition = (function(event) {
		if (_context == "2d"){
			// grab the x-y positions:
			_tempX = event.screenX;
			_tempY = event.screenY; 
			// tempX and tempY will contain mouse coordinates referred to the desktop
			// ((0,0) is the upper-left corner of the screen - ! but coordinates change only when we move the mouse into the browser window),
			// we can calculate the related values in meters and store them into position variable:
			this.position = [_tempX*_workspacePixelWidth, _tempY*_workspacePixelWidth, _tempZ*_workspacePixelWidth];	
		}
		else if (_context == "3d"){
			// grab the x-y positions:
			_tempX = event.clientX;
			_tempY = event.clientY; 
			// tempX and tempY will contain mouse coordinates referred to the viewport
			// ((0,0) is the upper-left corner of the viewport, calculate them in meters:
			this.position = [_tempX*_workspacePixelWidth, _tempY*_workspacePixelWidth, _tempZ*_workspacePixelWidth];
			// then rototranslate the position in the right system reference
			// (0,0,0) center of the simulated workspace:
			this.position[0] += (-window.innerWidth/2 * _workspacePixelWidth);
			this.position[1] += (-window.innerHeight/2 * _workspacePixelWidth);
			this.position[1] = -this.position[1];
		}
		return true;
	}).bindWithoutParam(this);
	
	/**
	 * This is the handler of the 'onmousewheel'/'DOMMouseScroll'  event fired
	 *  by the browser whenever mouse wheel is scrolled;
	 * @param {MouseEvent} event
	 * @returns {Boolean}
	 */
	var updateZPosition = (function(event){
		var delta = 0;
	    if (!event) event = window.event;
	    // normalize the delta:
	    if (event.wheelDelta) {
	        // IE and Opera:
	        delta = event.wheelDelta / 60;
	    } else if (event.detail) {
	        // W3C:
	        delta = -event.detail / 2;
	    }
	    // calculates the movement for Z axis (Z = 0 if the simulated end-effector will be in mid-depth):
	    //--------------------------------------------------------------------------------------------//
	    _tempZ = _tempZ - (delta*10); // <-- change here to increase/decrease mouse scrolling step
	    //--------------------------------------------------------------------------------------------//
	    // limits Z axis values according to workspace depth:
	    if (_tempZ*_workspacePixelWidth > workspaceSize.getZ()/2)	_tempZ = workspaceSize.getZ()/(2*_workspacePixelWidth);
	    else if (_tempZ*_workspacePixelWidth < -workspaceSize.getZ()/2) _tempZ = -workspaceSize.getZ()/(2*_workspacePixelWidth);
	    // finally updates the values into position variable:
		this.position = [_tempX*_workspacePixelWidth, _tempY*_workspacePixelWidth, _tempZ*_workspacePixelWidth];
		// if the used context is '3d' then adjust the z axis:
		if (_context == "3d"){
			this.position[2] = -this.position[2];
		}
		return true;
	}).bindWithoutParam(this);
	
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
	
	/* Privileged methods:-----------------------------------------------------------------------------------------------------*/
	/**
	 * Simulates the behavior of the methods and variables exposed by the real plugin:
	 */
	this.position = new Array(0,0,0);
	this.startDevice = function(){
		showMessage("log", "<span>Simulation enabled, use your mouse to move the haptic pointer when the Device is running.\n"+
				"           Virtual device workspace: " + workspaceSize.getX() + "m Wide x " + workspaceSize.getY() + "m High x " +
				workspaceSize.getZ() + "m Deep. Maximum force output: "+ maxForceOutput + "N.</span>");
		// if pointer simulation using mouse is active, bypasses the command to the real device
		// and stores the simulated position into this.position property that we will read when
		// {Device}.getPosition() method is called
		var IE = document.all ? true : false;
		if (!IE) { 
			document.captureEvents(Event.MOUSEMOVE);
		}
		if (document.addEventListener){
			// this is for all browsers except old IE:
			document.addEventListener('mousemove', updateXYPosition, false);
			document.addEventListener('mousewheel', updateZPosition, false);	//or 'DOMMouseScroll' event
		}
		else {
			// this is for old IE versions:
			document.attachEvent('onmousemove', updateXYPosition);
			document.attachEvent('onmousewheel', updateZPosition);
		}
		// now our virtual device can be said initialized:
		this.initialized = new Boolean(true);
	}
	
	this.stopDevice = function(){
		// if pointer simulation using mouse is active, bypasses the command
		// to the real device and removes the handler for 'mousemove' event:
		if (document.removeEventListener){
			document.removeEventListener('mousemove', updateXYPosition, false);
			document.removeEventListener('mousemove', updateZPosition, false);
		}
		else{
			document.detachEvent('onmousemove', updateXYPosition);
			document.detachEvent('onmousemove', updateZPosition);
		}
		// and finally 'stop' our virtual device:
		this.initialized = new Boolean(false);
	}
	
	this.initialized = new Boolean(false);
	
	this.sendForce = function(){
		if (!window.jhaptic.consoleIsEnabled && _alertDisplayed == false){
			_alertDisplayed = true;
			alert("ATTENTION! Debug Mode: \n2D pointer simulation using mouse coordinates is active but log messages are not shown" +
					" so you will not be able to monitor force feedback values.\n If you want to use simulation mode {VirtualDevice} and see" +
					" force feedback values please use the command '{VirtualDevice}.enableConsoleLog()' in your javascript source code.");
		}
	}
	
	this.maxForce = maxForceOutput; 	// [N]
	this.workspaceSize = workspaceSize.toArray();		// ([m],[m],[m])
	
	this.setContext = function(value){
		// calculates the width of a pixel on the screen related to physical device workspace [measured in Meters]:
		if (value == "2d"){
			_context = value;
			// (_workspacePixelWidth is the shift (in meters) of the end effector in the workspace
			// to which corresponds a shift of one pixel on the desktop screen,
			// the desktop will be vertically centered to fit the height and width of the physical workspace)
			_workspacePixelWidth = workspaceSize.getX() / window.screen.width;		//	[m/pixel]
			// checks if the height exceeds the size of the physical workspace, if yes then recalculates the value for _workspacePixelWidth:
			if (workspaceSize.getY() < (window.screen.height * _workspacePixelWidth) ){
				_workspacePixelWidth = workspaceSize.getY() / window.screen.height;	
			}
		}
		else if (value == "3d"){
			_context = value;
			// calculate the shift (in meters) of the end effector in the workspace
			// to which corresponds a shift of one pixel on the viewport:
			_workspacePixelWidth = workspaceSize.getX() / window.innerWidth;		//	[m/pixel]
			// checks if the height exceeds the size of the physical workspace, if yes then recalculates the value for _workspacePixelWidth:
			if (workspaceSize.getY() < (window.innerHeight * _workspacePixelWidth) ){
				_workspacePixelWidth = workspaceSize.getY() / window.innerHeight;
			}
		}
	}
	this.setContext("3d");  // initialization;
}