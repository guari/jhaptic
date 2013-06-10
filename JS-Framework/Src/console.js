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
 * Defines an ad-hoc console to help a developer to debug a code written using JHaptic library.
 * @author Andrea Guarinoni
 */
jhaptic.Console = function(){
	/**
	 * @constructor
	 */
	// Used to store the message box with logs and code input:
	var _messageBox;
	// Used to store graph logic objects:
	var _forceGraphX;
	var _forceGraphY;
	var _forceGraphZ;
	// and the virtual input/output renderer:
	var _virtualWorkspace;
	// used to calculate coordinates conversions:
	var _pixelWidth;
	// and the context in which we will work:
	var _context;
	
	/*Private methods:----------------------------------------------------------------------------------------------*/
	
	/**
	 * Handles the display of any error that occurs during code execution, this could be useful to
	 * debug a page with jhaptic library on a browser / development environment that doesn't offer
	 * a console log;
	 * @param {String} msg: the error description;
	 * @param {String} url: the location of the file on which the error occurred;
	 * @param {String} line: the number of the code line on which the error occurred;
	 * @private
	 */
	function displayError(msg, url, line){
		// if the console has already been created, show error messages on it:
		if (document.getElementById("debugConsole")){
			this.log("error", "<span>" + msg + "</span></br><span style='color:#000000'>File: " +
					"</span><span style='color:#646464; font-style:italic'>" + url + "<span style='color:#000000; font-style:normal'>  Code line: " + line +"</span>" +
					(getStackTrace() ? "</br><span style='color:#000000; font-style:normal'>Stacktrace: " +
					"</span><span style='color:#646464; font-style:italic'>" + getStackTrace() + "</span>" : ""));
			// show a notification on the hide/restore div:
			if (!document.getElementById("errorNotificationSpan")){
				var errorNotification = document.createElement("span");
				errorNotification.id = "errorNotificationSpan";
				var textNode = document.createTextNode("1");
				errorNotification.appendChild(textNode);
				var internalSpan = document.createElement('span');
				with (internalSpan.style){
					borderLeft = "1px solid #77b2fc";	
				}
				internalSpan.appendChild(errorNotification);
				var externalSpan = document.createElement('span');
				with (externalSpan.style){
					position = "relative";
					float = "right";
					display = "inline-block";
					borderLeft = "1px solid #5597d3";
				}
				externalSpan.appendChild(internalSpan);
				document.getElementById ("hideRestoreConsoleDiv").appendChild(externalSpan);
				// define css rules for the notification:
				with (document.getElementById("errorNotificationSpan").style){
					display = "inline-block";
					minWidth = "18px";
					margin = "2px 10px 2px 10px";
					color = "#ffffff";
					backgroundColor = "#a90101";
					fontSize = "0.7em";
					fontFamily = "Arial, Sans-serif";
					// these will be displayed only on browsers that support css3:
					mozBorderRadius = "5px 5px 5px 5px";
					webkitBorderRadius = "5px 5px 5px 5px";
					borderRadius = "10px 10px 10px 10px";
					filter = "alpha(opacity=90)";
					mozOpacity = "0.9";
					opacity = "0.9";
					align = "center";
				}
			}
			else {
				var errorNotification = document.getElementById ("errorNotificationSpan");
				var counter = errorNotification.firstChild.nodeValue;
				counter ++;
				errorNotification.firstChild.nodeValue = counter;
			}
		}
		// If the console has not yet been created and some errors occur, then display it in a popup window:
		else alert("Error: " + msg + "\nFile: " + url + "\nCode line: " + line);
	}
	
	/**
	 * Tries to build a stacktrace if it is possible;
	 */
	function getStackTrace(){
		var stackTrace = "";
		if (window.event.stack) {
			stackTrace = window.event.stack;
		}
		else if (window.event.stacktrace) {
			stackTrace = window.event.stacktrace;
		}
		else{
			if (arguments.callee.caller.caller.name){	
				// 'name' property is available
				var stackAmount = 5, f = arguments.callee.caller.caller;
				if (f.name!="" && f.name!=undefined){
					for (var i = 0; i < stackAmount && f != null; i++) {
			        	stackTrace += ( ( i==0 ? "" : " << ") + ( (f.name=="" || f.name==undefined)? "(anonymous function)" : f.name) );
			        	f = f.caller;
			    	}	
				}
			}
		}
		/*
        try{
        	(0)();	// generate an error so we can obtain a full stacktrace;
        }
        catch(error){
        	if (error.stack) stackTrace += "\n" + error.stack;
        	else if (error.stacktrace) stackTrace += "\n" + error.stacktrace;
        }*/
        return stackTrace;
	}
	
	/**
	 * This is a workaround since the correct code "window.addEventListener('error', displayError, false)"
	 * doesn't work as expected on many browsers; the code "window.onError = displayError'' works but we
	 * don't want to override a possible handler set by the user into his page for this event;
	 * @param {Function} jhapticHandler: the handler used by the library for the 'error' event fired by the browser;
	 * @private
	 */
	function addWindowOnError(jhapticHandler) {
		var userHandler;
		if (typeof window.onerror == 'function') {
			// the user has set a function to handle this event:
			userHandler = window.onerror;
			window.onerror = function(msg, url, line){
				userHandler(msg, url, line);
				jhapticHandler(msg, url, line);
			}
		} 
		else {
			// the user has not set an handler for the error event:
			window.onerror = jhapticHandler;
		}
	}
	
	/**
	 * Same speech as 'addWindowOnError', removes the handler previously set;
	 * @param {Functon} jhapticHandler
	 * @private
	 */
	function removeWindowOnError(jhapticHandler) {
		var userHandler;
		if (window.onerror == jhapticHandler) {
			window.onerror = null;
		} 
	}
	
	/**
	 * This is a simple function to keep an html element in a fixed position at the bottom of the web page
	 *  (like a sticky footer) while scrolling the browser window;
	 * @param {HTMLElement} htmlElem: the element of the web page that needs to be sticked;
	 * @private
	 */
	function stickyConsoleWhenScrolling(htmlElem) {
		document.body.style.padding = "0px";
		document.body.style.margin = "0px";
		document.body.style.paddingBottom = "135px";
		with (htmlElem.style){
			position = "fixed";
			height = "135px";
			minHeight = "135px";
			maxHeight = "250px";
			bottom = "0";
			width = "100%";
		}
	}
    
	/**
	 * Add the possibility to vertically resize the console by dragging the marker up and down;
	 * @param {HTMLDivElement} resizeMarkerDiv: the DIV that is dragged to resize the console;
	 * @private
	 */
    function makeConsoleResizable(resizeMarkerDiv) {
    	// these variables will be accessed thanks to the closure chains:
    	var startY, startHeight;
    	var targetDiv = document.getElementById("hapticDiv");
        
        resizeMarkerDiv.addEventHandler('mousedown', function (event) {
            event.preventDefault();
            // when mouse clicks down on resizeMarkerDiv store the starting Y coordinate:
            startY = event.clientY || event.pageY;
            // and the original height of the targetDiv that has to be resized:
            startHeight = parseInt(targetDiv.style.height);
            
            var onMouseMove = function(event){
            	event.preventDefault();
            	// mouse is dragging the resizeMarkerDiv, so let's calculate the new height
            	// of the targetDiv:
                var newHeight = startHeight + (startY - (event.clientY || event.pageY));
                // check if into CSS properties of the resizeable element are defined a minHeight and MaxHeight:
                newHeight = (targetDiv.style.minHeight ?
                		(newHeight < parseInt(targetDiv.style.minHeight) ? parseInt(targetDiv.style.minHeight) : newHeight) : newHeight);
                newHeight = (targetDiv.style.maxHeight ?
                		(newHeight > parseInt(targetDiv.style.maxHeight) ? parseInt(targetDiv.style.maxHeight) : newHeight) : newHeight);
                // and change the current div height:
                targetDiv.style.height = newHeight + "px";
                // finally adjust the webpage padding in order to make all the content viewable
                // without needing to hide the console:
                document.body.style.paddingBottom = newHeight + "px";
            }.bindWithoutParam(this);
            
            var onMouseUp = function(event){
            	// the user releases the mouse button indicating completion of drag-resizing,
            	// so clean the events handlers:
            	document.removeEventHandler('mousemove', onMouseMove);
                document.removeEventHandler('mouseup', onMouseUp);
            }.bindWithoutParam(this);
            
            document.addEventHandler('mousemove', onMouseMove);
            document.addEventHandler('mouseup', onMouseUp);
        }.bindWithoutParam(this));
    }
	
	/**
	 * This function handles the behavior of the console when the Hide/Restore div
	 * is clicked;
	 * @private
	 */
	function hideRestoreConsole(){
		// if we have to hide the console:
		if (document.getElementById ("hideRestoreConsoleArrow").firstChild.nodeValue == "\u25bc"){ // hide 'v'
			// these will be displayed only on browsers that support css3:
			with (document.getElementById("hapticDiv").style){
				webkitTransition = "all 0.8s ease";
				mozTransition = "all 0.8s ease";
				oTransition = "all 0.8s ease";
				msTransition = "all 0.8s ease";
				transition = "all 0.8s ease";
				transform = "translate(0px," + height + ")";
			    webkitTransform = "translate(0px," + height +")";
			    oTransform = "translate(0px," + height +")";
			    mozTransform = "translate(0px," + height +")";
			}
			document.getElementById("hapticDiv").style.visibility="hidden";
			document.getElementById ("hideRestoreConsoleArrow").firstChild.nodeValue = "\u25b2"; // restore '^'
			document.body.style.paddingBottom = (parseInt(document.body.style.paddingBottom) - parseInt(document.getElementById("hapticDiv").style.height)) + "px";
		}
		// if we have to restore the console:
		else {
			document.getElementById("hapticDiv").style.visibility="visible";
			with (document.getElementById("hapticDiv").style){
				// these will be displayed only on browsers that support css3:
				webkitTransition = "all 0.8s ease";
				mozTransition = "all 0.8s ease";
				oTransition = "all 0.8s ease";
				msTransition = "all 0.8s ease";
				transition = "all 0.8s ease";
				transform = "translate(0px,0px)";
			    webkitTransform = "translate(0px,0px)";
			    oTransform = "translate(0px,0px)";
			    mozTransform = "translate(0px,0px)";
			}
			document.getElementById ("hideRestoreConsoleArrow").firstChild.nodeValue = "\u25bc"; // hide 'v'
			document.body.style.paddingBottom = (parseInt(document.body.style.paddingBottom) + parseInt(document.getElementById("hapticDiv").style.height)) + "px";
		}
	}
	
	/**
	 * This function handles the behavior of the console when the view selector divs
	 * are clicked;
	 * @param {HTMLElement} viewSelectorDiv: a reference to the div clicked;
	 * @param {String} elemId: the id of the html element that needs to be set visible;
	 * @private
	 */
	function changeConsoleView(viewSelectorDiv, elemId){
		var views = document.getElementById("debugContainerDiv").childNodes;
		// finds the current view (views[i]):
		var i=0;
		while (views[i].style.visibility == "hidden"){
			i++;
		}
		// if we need to change the view:
		if (elemId != views[i].id){
			var buttons = document.getElementById("debugViewSelectorDiv").childNodes;
			var k=0;
			while (buttons[k].style.backgroundColor == "#bedbef" || buttons[k].style.backgroundColor == "rgb(190, 219, 239)"){
				k++;
			}
			buttons[k].style.color = "#00355a";
			buttons[k].style.backgroundColor = "#bedbef";
			buttons[k].style.textShadow = null;
			// change the background of the selected button (div):
			viewSelectorDiv.style.color = "#ffffff";
			viewSelectorDiv.style.backgroundColor = "#5c98cc";
			viewSelectorDiv.style.textShadow = "#000000 0px -1px 7px";
			// hides the current view:
			with (views[i].style){
				// these will be displayed only on browsers that support css3:
				/*
				webkitTransition = "all 0.8s ease";
				mozTransition = "all 0.8s ease";
				oTransition = "all 0.8s ease";
				msTransition = "all 0.8s ease";
				transition = "all 0.8s ease";
				transform = "strech(" + width + ", 0%)";
			    webkitTransform = "rotateX(90deg)";
			    oTransform = "translate(" + width + ", 0%)";
			    mozTransform = "translate(" + width + ", 0%)";
			    */
			    visibility = "hidden";
			    //webkitTransform = "rotateX(-90deg)";
			}
			with (document.getElementById(elemId).style){
				// then brings up the new view:
				//webkitTransform = "rotateX(-90deg)";
				// Due to IE bug we can't set "visibility = 'visible';" because in this way IE seems to ignore
				// document hierarchy, overriding the same parameter for the div hapticDiv, so we do:
				visibility = "";
				/*
				webkitTransition = "all 0.8s ease";
				mozTransition = "all 0.8s ease";
				oTransition = "all 0.8s ease";
				msTransition = "all 0.8s ease";
				transition = "all 0.8s ease";
				transform = "strech(" + width + ", 0%)";
			    webkitTransform = "rotateX(90deg)";
			    oTransform = "translate(" + width + ", 0%)";
			    mozTransform = "translate(" + width + ", 0%)";
			    */
			}
		}
	}
		
	/**
	 * Create a wrapper for the console, that enables the use of both JHaptic console
	 * and native console (if available);
	 */
	function wrapConsole(){
		if (!(window.console)){
			window.console = {};
		}
		if (window.console.log){
			// the following line is used to save a reference to the native console
			// provided within the browser (if available), when enabling JHaptic console:
			window.console.defaultLog =  window.console.log;
			// and now we create a wrapper:
			window.console.log = function(){
				// so we can display the message both on JHaptic console
				this.log('msg', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]);
				// ...and also on the native console:
				window.console.defaultLog(arguments.length>1? arguments:arguments[0]); //or ..(Array.prototype.slice.call(arguments))
				// as you see passing multiple arguments is supported;
			}.bindWithoutParam(this);
		}
		else {
			window.console.log = function(){
				this.log('msg', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]); 
			}.bindWithoutParam(this);
		}
		if (window.console.warn){
			window.console.defaultWarn =  window.console.warn;
			window.console.warn = function(){
				this.log('warning', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]);
				window.console.defaultWarn(arguments.length>1? arguments:arguments[0]);
			}.bindWithoutParam(this);
		}
		else {
			window.console.warn = function(){
				this.log('warning', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]);
			}.bindWithoutParam(this);
		}
		if (window.console.error){ 
			window.console.defaultError =  window.console.error;
			window.console.error = function(){
				this.log('error', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]);
				window.console.defaultError(arguments.length>1? arguments:arguments[0]);
			}.bindWithoutParam(this);
		}
		else {
			window.console.error = function(){
				this.log('error', arguments.length>1? Array.prototype.slice.call(arguments):arguments[0]);
			}.bindWithoutParam(this);
		}
		if (window.console.inspect){ 
			window.console.defaultInspect =  window.console.inspect;
			window.console.inspect = function(){
				this.log('inspect', arguments[0]);
				window.console.defaultInspect(arguments.length>1? arguments:arguments[0]);
			}.bindWithoutParam(this);
		}
		else {
			window.console.inspect = function(){
				this.log('inspect', arguments[0]);
			}.bindWithoutParam(this);
		}
		if (window.console.trace){ 
			window.console.defaultTrace =  window.console.trace;
			window.console.trace = function(){
				this.log('trace', arguments[0]);
				window.console.defaultTrace(arguments.length>1? arguments:arguments[0]);
			}.bindWithoutParam(this);
		}
		else {
			window.console.trace = function(){
				this.log('trace', arguments[0]);
			}.bindWithoutParam(this);
		}
	}
	
	/**
	 * Clean the DOM by restoring the native console if available;
	 */
	function unWrapConsole(){
		if (window.console.defaultLog){
			window.console.log = window.console.defaultLog;
			delete window.console.defaultLog;
		}
		else delete window.console.log;
		if (window.console.defaultWarn){
			window.console.warn = window.console.defaultWarn;
			delete window.console.defaultWarn;
		}
		else delete window.console.warn;
		if (window.console.defaultError){
			window.console.error = window.console.defaultError;
			delete window.console.defaultError;
		}
		else delete window.console.error;
		if (window.console.defaultInspect){
			window.console.inspect = window.console.defaultInspect;
			delete window.console.defaultInspect;
		}
		else delete window.console.inspect;
	}
	
	/* Privileged methods:-----------------------------------------------------------------------------------------------*/
	/**
	 * Creates and shows on web page the console;
	 * @param {Number} refreshInterval: used to determine graphs monitored time [ms];
	 * @param {Number} maxSupportedForce: used to compute visual force amplitude [N];
	 * @param {Vector} workspaceSize: used to draw virtual workspace [m];
	 * @param {Number} pixelWidth: used to calculate coordinates conversions [m/px];
	 */
	this.enable = function(refreshInterval, maxSupportedForce, workspaceSize, pixelWidth){
		_pixelWidth = pixelWidth;
		// Sets an handler to display all kinds of errors that occur, not only jhaptic debug messages:
		addWindowOnError(displayError.bindWithoutParam(this));
		// Here we generate the DOM structure for the debug section:
		// This code is for building the html structure for the coordinates form:
		var newForm = document.createElement("form");
		newForm.id = "debugForm";
		newForm.name = "debugForm";
		document.getElementById("hapticDiv").appendChild(newForm);
		var textArray = new Array ("Position coordinates [m]:",
                                   "Position coordinates [pixel]:",
                                   "Force values output [N]:",
                                   "Force values input [N]:",
                                   "Speed values [cm/s]:",
                                   "Speed values [pixel/ms]:",
                                   "Acceleration values [cm/s^2]:",
                                   "Acceleration values [pixel/ms^2]:");
		var newText;
		var newBreakLine;
		var inputArray = new Array("X", "Y", "Z");
		var newInput;
		var newSelect;
		var newOption;
		for (var i=0; i<3; i++){
			newSelect = document.createElement("select");
			newSelect.id = "debugSelect" + i;
			for (var k=0; k<textArray.length; k++){
				newOption = document.createElement("option");
				newOption.value = textArray[k];
				newText = document.createTextNode(textArray[k]);
				newOption.appendChild(newText);
				newSelect.appendChild(newOption);
			}
			document.getElementById("debugForm").appendChild(newSelect);
			newBreakLine = document.createElement("br");
			document.getElementById("debugForm").appendChild(newBreakLine);
			for (var j=0; j<inputArray.length; j++){
				newInput = document.createElement("input");
				newInput.name = "debugCoord" + i + inputArray[j];	// debugCoord0X, ..., debugCoord1X,...
				newInput.id = "debugCoord" + i + inputArray[j];
				newInput.value = "0";
				newInput.size = "5";
				newInput.readOnly = "true";
				// and set the css style for the input fields:
				with (newInput.style){
					fontSize = "0.9em";
					width = "58px";
					margin = "2px";
					borderColor = "#50a9d7";
					borderWidth = "1px";
					mozBorderRadius = "3px";
					webkitBorderRadius = "3px";
					borderRadius = "3px";
				}
				newText = document.createTextNode(inputArray[j]+": ");
				document.getElementById("debugForm").appendChild(newText);
				document.getElementById("debugForm").appendChild(newInput);
			}
			newBreakLine = document.createElement("br");
			document.getElementById("debugForm").appendChild(newBreakLine);
		}
		// Set default values displayed into the form:
		document.getElementById("debugSelect0").childNodes[0].setAttribute("selected");
		document.getElementById("debugSelect1").childNodes[2].setAttribute("selected");
		document.getElementById("debugSelect2").childNodes[4].setAttribute("selected");
		// This code is for building the html structure for the div that contains the textarea for messages
		// (this is needed due to a IE bug that doesn't set the width of a textarea to 'auto') and the canvas for graphs:
		var container = document.createElement("div");
		container.id = "debugContainerDiv";
		document.getElementById("hapticDiv").appendChild(container);
		// This code is for building the html structure for the area with log messages output:
		var messageBoxContainer = document.createElement("div");
		messageBoxContainer.id = "debugConsole";
		document.getElementById("debugContainerDiv").appendChild(messageBoxContainer);
		_messageBox = new jhaptic.MessageBox(messageBoxContainer);
		// This code is for building the html structure for canvas used to draw graphs,
		// Canvas element is supported on IE9+, Firefox 2+, Safari 3.1+, Chrome 2+, Opera 10+ :
		var newCanvas;
		var graphArray = new Array("debugForceGraphX", "debugForceGraphY", "debugForceGraphZ");
		for (var i=0; i<graphArray.length; i++){
			newCanvas = document.createElement("canvas");
			newCanvas.id = graphArray[i];
			newCanvas.style.visibility = "hidden";
			document.getElementById("debugContainerDiv").appendChild(newCanvas);
			newText = document.createTextNode("Your browser doesn't appear to support the HTML5 Canvas element.");
			document.getElementById(graphArray[i]).appendChild(newText);
		}
		// This code is for building the html structure for the div needed to contain the canvas for the 3d virtual I/O:
		var container = document.createElement("div");
		container.id = "debugVirtualWorkspace";
		container.style.visibility = "hidden";
		document.getElementById("debugContainerDiv").appendChild(container);
		// This code is for building the html structure for the div used to change the console view:
		var viewSelector = document.createElement("div");
		viewSelector.id = "debugViewSelectorDiv";
		document.getElementById("hapticDiv").appendChild(viewSelector);
		var viewArray = new Array();
		viewArray[0] = new Array("debugMessageViewDiv", "debugForceGraphXViewDiv", "debugForceGraphYViewDiv", "debugForceGraphZViewDiv", "debugVirtualWorkspaceViewDiv");
		viewArray[1] = new Array("Messages", "Fx Graph", "Fy Graph", "Fz Graph", "Virtual I/O");
		var newDiv;
		for (var i=0; i<viewArray[0].length; i++){
			newDiv = document.createElement("div");
			newDiv.id = viewArray[0][i];
			document.getElementById("debugViewSelectorDiv").appendChild(newDiv);
			newText = document.createTextNode(viewArray[1][i]);
			document.getElementById(viewArray[0][i]).appendChild(newText);
		}
		// here we build the html structure for the div to hide/restore the console
		// we've stored into hapticDiv:
		var hideRestoreConsoleDiv = document.createElement("div");
		hideRestoreConsoleDiv.id = "hideRestoreConsoleDiv";
		document.body.appendChild(hideRestoreConsoleDiv);
		document.getElementById("hideRestoreConsoleDiv").innerHTML = "<span id='hideRestoreConsoleArrow'>&#x25bc</span>" +
				"<span><span>Refresh: </span><span id='debugDeviceRefresh'>---</span></span>";
		// and the invisible div used to resize the console:
		var resizeConsoleDiv = document.createElement("div");
		resizeConsoleDiv.id = "resizeConsoleDiv";
		document.getElementById("hapticDiv").appendChild(resizeConsoleDiv);
		
		// set the CSS style for the console:
		// these are global:
		with (document.getElementById("hapticDiv").style){
			backgroundColor = "rgb(188,215,251)";
			backgroundColor = "rgba(188,215,251,0.8)";
			display = "block";
            lineHeight = "normal";
			width = "100%";
			minWidth = "550px";
			fontSize = "medium";
			// these will be displayed only on browsers that support css3:
			mozBorderTopLeftRadius = "10px";
			webkitBorderTopLeftRadius = "10px";
			borderTopLeftRadius = "10px";
			mozBorderTopRightRadius = "10px";
			webkitBorderTopRightRadius = "10px";
			borderTopRightRadius = "10px";
			backgroundImage = "-moz-linear-gradient(top, rgba(216,232,252,0.5), rgba(149,189,237,0.9))";
			backgroundImage = "-webkit-gradient(linear, center top, center bottom, from(rgba(216,232,252,0.5)), to(rgba(149,189,237,0.9)))";
			filter = "progid:DXImageTransform.Microsoft.gradient(startColorstr='rgba(216,232,252,0.5)', endColorstr='rgba(149,189,237,0.9)')";
			boxShadow = "0 -3px 13px rgba(0,0,0,0.75)";
			webkitBoxShadow = "0 -3px 13px rgba(0,0,0, 0.75)";
			mozBoxShadow = "0 -3px 13px rgba(0, 0, 0, 0.75)";
			filter = "alpha(opacity=100)";
			mozOpacity = "1";
			opacity = "1";
            textShadow = "none";
		}
		with (document.getElementById("resizeConsoleDiv").style){
			position = "absolute";
			top = "0px";
			left = "0px";
			right = "0px";
			bottom = "auto";
			width = "100%";
			height = "5px";
			//visibility = "hidden";
			cursor = "n-resize";
		}
		// these are for coordinates output part:
		with (document.getElementById("debugForm").style){
			position = "absolute";
			color = "#284c65";
			right = "auto";
			left = "10px";
			top = "6px";
			bottom = "10px";
			height = "auto";
			width = "250px";
			fontFamily = "Candara, Trebuchet MS, Arial, Helvetica, Sans-serif";
			fontSize = "0.8em";
			textShadow = "#ffffff 0px 0px 6px";
		}
		for (var i=0; i<3; i++){
			with (document.getElementById("debugSelect"+i).style){
				width = "92%";
				color = "#00355a";
				backgroundColor = "transparent";
				fontFamily = "Candara, Trebuchet MS, Arial, Helvetica, Sans-serif";
				fontSize = "0.9em";
				border = "1px";
				margin = "0px";
				cursor = "pointer";
				// these will be displayed only on browsers that support css3:
				borderTopLeftRadius = "5px";
				mozBorderTopLeftRadius = "5px";
				webkitBorderTopLeftRadius = "5px";
				borderTopRightRadius = "5px";
				mozBorderTopRightRadius = "5px";
				webkitBorderTopRightRadius = "5px";
				appearance = "none";
				webkitAppearance = "none";
				mozAppearance = "none";
				textShadow = "#d8e8fc 0px 0px 6px";
			}
		}
		// these are for the container of the textarea and the canvas:
		with (document.getElementById("debugContainerDiv").style){
			position = "absolute";
			top = "6px";
			left = "0px";
			right = "0px";
			bottom = "10px";
			width = "auto";
			height = "auto";
			marginLeft = "250px";
			marginRight = "73px";
			// these will be displayed only on browsers that support css3:
			borderColor = "#50a9d7"
			mozBorderRadius = "6px";
			webkitBorderRadius = "6px";
			borderRadius = "6px";
			boxShadow = "0 2px 10px rgba(27, 63, 111,0.75)";
			webkitBoxShadow = "0 2px 10px rgba(27, 63, 111, 0.75)";
			mozBoxShadow = "0 2px 10px rgba(27, 63, 111,, 0.75)";
		}
		// these are for text message output part:
		with (document.getElementById("debugConsole").style){
			position = "absolute";
			top = "0px";
			left = "0px";
			right = "0px";
			bottom = "0px";
			width = "100%";
			height = "auto";
			resize = "none";
			//borderColor = "#50a9d7";
			fontFamily = "Consolas";
			fontSize = "0.8em";
			//visibility = "visible";
			// these will be displayed only on browsers that support css3:
			mozBorderRadius = "6px";
			webkitBorderRadius = "6px";
			borderRadius = "6px";
		}
		// these are for the graphs output part:
		for (var i=1; i<document.getElementById("debugContainerDiv").childNodes.length; i++){
			with (document.getElementById("debugContainerDiv").childNodes[i].style){
				position = "absolute";
				top = "0px";
				left = "0px";
				right = "0px";
				bottom = "0px";
				width = "100%";
				height = "100%";
				resize = "none";
				borderColor = "#50a9d7";
				// these will be displayed only on browsers that support css3:
				mozBorderRadius = "6px";
				webkitBorderRadius = "6px";
				borderRadius = "6px";
			}
		}
		// these are for view selector part (the div on the right containing all the 'buttons' to change view):
		with (document.getElementById("debugViewSelectorDiv").style){
			position = "absolute";
			left = "auto";
			right = "10px";
			top = "15px";
			height = "100px";
			width = "60px";
			fontFamily = "Candara, Trebuchet MS, Arial, Helvetica, Sans-serif";
			fontSize = "0.8em";
		}
		// these are for the divs used as buttons into view selector:
		var viewDivs = document.getElementById("debugViewSelectorDiv").childNodes;
		for (var i=0; i<viewDivs.length; i++){
			with(viewDivs[i].style){
				height = "20px";
				width = "100%";
				color = "#00355a";
				backgroundColor = "#bedbef";
				textAlign = "center";
				cursor = "pointer";
				// these will be displayed only on browsers that support css3:
				webkitBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
				mozBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
				boxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
			}
			if (i==0) {
				with(viewDivs[i].style){
					color = "#ffffff";
					backgroundColor = "#5c98cc";
					// these will be displayed only on browsers that support css3:
					mozBorderTopRightRadius = "7px";
					webkitBorderTopRightRadius = "7px";
					borderTopRightRadius = "7px";
					textShadow = "#000000 0px -1px 7px";
				}	
			}
			else if (i==viewDivs.length-1){
				with(viewDivs[i].style){
					color = "#00355a";
					// these will be displayed only on browsers that support css3:
					mozBorderBottomRightRadius = "7px";
					webkitBorderBottomRightRadius = "7px";
					borderBottomRightRadius = "7px";
				}
			}
		}
		// these are for the Hide/Restore console button (div):
		if (navigator.userAgent.indexOf("MSIE") != -1){
			// for Internet Explorer 9-:
			var verOffset = navigator.userAgent.indexOf("MSIE");
			if (parseInt(navigator.userAgent.substring(verOffset+4, verOffset+9)) <= 9){
			document.getElementById("hideRestoreConsoleDiv").style.backgroundColor = "#5597d3";
			}
		}
		with (document.getElementById("hideRestoreConsoleDiv").style){
			position = "fixed";
            lineHeight = "normal";
			width = "200px";
			left = "50%";
			bottom = "0px";
			marginLeft = -parseInt(width)/2 + "px";
			color = "#ffffff";
			textAlign = "center";
			fontSize = "0.9em";
			fontFamily = "Candara, Trebuchet MS, Arial, Helvetica, Sans-serif";
			cursor = "pointer";
			overflow = "hidden";
			// these will be displayed only on browsers that support css3:
			mozBorderTopLeftRadius = "7px";
			webkitBorderTopLeftRadius = "7px";
			borderTopLeftRadius = "7px";
			mozBorderTopRightRadius = "7px";
			webkitBorderTopRightRadius = "7px";
			borderTopRightRadius = "7px";
			filter = "alpha(opacity=1)";
			mozOpacity = "1";
			opacity = "1";
			webkitBoxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";
			mozBoxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";
			boxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";
			textShadow = "#000000 0px -1px 7px";
			backgroundImage = "-moz-radial-gradient(50% 19%, ellipse cover, rgba(113, 193, 249, 0.8), #3379cf 100%)";
			backgroundImage = "-webkit-radial-gradient(50% 19%, ellipse cover, rgba(113, 193, 249, 0.8), #3379cf 100%)";
			backgroundImage = "-o-radial-gradient(50% 19%, ellipse cover, rgba(113, 193, 249, 0.8), #3379cf 100%)";
			backgroundImage = "-ms-radial-gradient(50% 19%, ellipse cover, rgba(113, 193, 249, 0.8), #3379cf 100%)";
			backgroundImage = "radial-gradient(50% 19%, ellipse cover, rgba(113, 193, 249, 0.8), #3379cf 100%)";
        }
		with (document.getElementById("hideRestoreConsoleArrow").style){
			display = "inline-block";
			textAlign = "center";
			padding = "0px 10px 0px 0px";
			textShadow = "#000000 0px 0px 15px";
		}
		document.getElementById('debugDeviceRefresh').parentNode.style.borderLeft = "1px solid #5597d3";
		with (document.getElementById('debugDeviceRefresh').previousSibling.style){
			padding = "0px 0px 0px 10px";
			borderLeft = "1px solid #77b2fc";
		}
		with(document.getElementById('debugDeviceRefresh').style){
			position = "relative";
			width = "35px";
			display = "inline-block";
			margin = "0px 0px 0px 0px";
			padding = "0px 10px 0px 0px";
			textAlign = "center";
			textShadow = "#000000 0px 0px 7px";
		}
		// draws arrows for the 'select' dropdown elements:
		var topOffset = 0;
		for (var i=0; i<3; i++){
			newSelect = document.getElementById("debugSelect" + i);
			if (newSelect.style.appearance || newSelect.style.webkitAppearance || newSelect.style.mozAppearance){
				newDiv = document.createElement("div");
				newText = document.createTextNode("\u2228");
				with (newDiv.style){
					color = "#027bb9";
					position = "absolute";
					fontSize = "0.9em";
					top = topOffset + "px";
					right = "25px";
					textShadow = "#d8e8fc 0px 0px 6px";
				}	
				newDiv.appendChild(newText);
				document.getElementById("debugForm").appendChild(newDiv);
				topOffset += 37;
			}
		}
		// puts the console at the bottom of the web page:
		stickyConsoleWhenScrolling(document.getElementById('hapticDiv'));
		// then store a reference to {jhaptic.Console}.log() method into 'window' object
		// so a developer can use jhaptic console simply calling console.log("my log message"),
		// console.warn("my warning message"), console.error("my error message"),
		// console.inspect(obj) when console is enabled:
		wrapConsole.call(this);
		// initializes graphs:
		_forceGraphX = new jhaptic.Graph(document.getElementById("debugForceGraphX"), refreshInterval);
		_forceGraphY = new jhaptic.Graph(document.getElementById("debugForceGraphY"), refreshInterval);
		_forceGraphZ = new jhaptic.Graph(document.getElementById("debugForceGraphZ"), refreshInterval);
		// creates the contents of the virtual I/O tab:
		_virtualWorkspace = new jhaptic.VirtualWorkspace(document.getElementById("debugVirtualWorkspace"), maxSupportedForce, workspaceSize);
		// puts in viewArray the 'ids' of the elements to which each 'div' contained in debugViewSelectorDiv points:
		viewArray[2] = new Array();
		for (var i=0; i<document.getElementById("debugContainerDiv").childNodes.length; i++){
			viewArray[2][i] = document.getElementById("debugContainerDiv").childNodes[i].id;
		}
		// when we press the 'divs' on the right to change the console view:
		for (var i=0; i<viewArray[1].length; i++){
			document.getElementById(viewArray[0][i]).addEventHandler('click', changeConsoleView.bindAsEventListener(this,viewArray[2][i]));
		}
		// and finally we show it on web page:
		document.getElementById("hapticDiv").style.visibility="visible";
		// if we want to hide the console:
		document.getElementById("hideRestoreConsoleDiv").addEventHandler('click', hideRestoreConsole);
		// add an 'hover' effect on the buttons on the right of the console:
		for (var i=0; i<viewDivs.length; i++){
			viewDivs[i].addEventHandler('mouseover', function(e){
				var target = e.target || e.srcElement;
				with (target.style){
					//borderRadius = "0px 3px 3px 0px";
					webkitTransition = "all 0.3s ease";
					mozTransition = "all 0.3s ease";
					oTransition = "all 0.3s ease";
					msTransition = "all 0.3s ease";
					transition = "all 0.3s ease";
					width = "110%";
					webkitBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.9)";
					mozBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.9)";
					boxShadow = "1px -1px 10px rgba(0, 0, 0, 0.9)";
				}
			});
			viewDivs[i].addEventHandler('mouseout', function(e){
				var target = e.target || e.srcElement;
				with (target.style){
					//borderRadius = "0px 3px 3px 0px";
					webkitTransition = "all 0.3s ease";
					mozTransition = "all 0.3s ease";
					oTransition = "all 0.3s ease";
					msTransition = "all 0.3s ease";
					transition = "all 0.3s ease";
					width = "100%";
					webkitBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
					mozBoxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
					boxShadow = "1px -1px 10px rgba(0, 0, 0, 0.7)";
				}
			});
		}
		document.getElementById("hideRestoreConsoleDiv").addEventHandler("mouseover", function(e){
			var target = e.currentTarget || e.srcElement;
			with (target.style){
				webkitTransition = "all 0.3s ease";
				mozTransition = "all 0.3s ease";
				oTransition = "all 0.3s ease";
				msTransition = "all 0.3s ease";
				transition = "all 0.3s ease";
				webkitBoxShadow = "0px 3px 30px rgba(0, 0, 0, 3.0)";
				mozBoxShadow = "0px 3px 30px rgba(0, 0, 0, 3.0)";
				boxShadow = "0px 3px 30px rgba(0, 0, 0, 3.0)";	
			}
		});
		document.getElementById("hideRestoreConsoleDiv").addEventHandler("mouseout", function(e){
			var target = e.currentTarget || e.srcElement;
			with (target.style){
				webkitTransition = "all 0.3s ease";
				mozTransition = "all 0.3s ease";
				oTransition = "all 0.3s ease";
				msTransition = "all 0.3s ease";
				transition = "all 0.3s ease";
				webkitBoxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";
				mozBoxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";
				boxShadow = "0px 3px 20px rgba(0, 0, 0, 0.9)";	
			}
		});
		makeConsoleResizable.call(this, document.getElementById("resizeConsoleDiv"));
	}
	
	/**
	 * Removes from web page the console;
	 */
	this.disable = function(){
		var hapticDiv = document.getElementById("hapticDiv");
		// Removes the log messages console and hides the div:
		hapticDiv.style.visibility = "hidden";
		// Removes the button (div) to hide/restore console:
		document.getElementById("hideRestoreConsoleDiv").removeEventListener();
		document.body.removeChild(document.getElementById("hideRestoreConsoleDiv"));
		// Removes all the attached html elements created for the console
		// structure from the hapticDiv:
		hapticDiv.removeChild(document.getElementById("debugForm"));
		hapticDiv.removeChild(document.getElementById("debugContainerDiv"));
		hapticDiv.removeChild(document.getElementById("debugViewSelectorDiv"));
		// And removes the listener for displaying any other error:
		removeWindowOnError(displayError);
		// finally restore the native console:
		unWrapConsole.call(this);
	}
	
	/**
	 * Shows log data on jhaptic console;
	 * @param {String} cmd: allowed values: 'force', 'position', 'speed', 'acceleration', 'forceInput', 'msg', 'error',
	 * 									    'warning', 'inspect', 'graph', 'context', 'deviceRefresh', 'trace';
	 * @param {String} arg: the argument of the command to be displayed
* 							(if 'cmd' = "force", "position", "speed", "acceleration", "forceInput" or "graph"
* 							'arg' needs to be a Vector stringified, if 'cmd' = "msg", "error" or "warning"
* 							'arg' needs to be a string containing the log message,
* 							if 'cmd' = "context" 'arg' needs to be the context id string,
* 							if 'cmd' = "deviceRefresh" 'arg' needs to be a string containing
*  							the current refresh interval in milliseconds,
* 							if 'cmd' = "inspect" 'arg' need to be a reference to the object to inspect);
	 */
	this.log = function(cmd, arg){
			switch (cmd){
			case "position":	//	[m]
				for (var i=0; i<3; i++){
					// Checks if these values have to be displayed:
					switch (document.getElementById("debugSelect"+i).value){
					case "Position coordinates [pixel]:":
						document.getElementById("debugCoord"+i+"X").value = Math.round(arg.toVector().getX() / _pixelWidth);
						document.getElementById("debugCoord"+i+"Y").value = Math.round(arg.toVector().getY() / _pixelWidth);
						document.getElementById("debugCoord"+i+"Z").value = Math.round(arg.toVector().getZ() / _pixelWidth);
						break;
					case "Position coordinates [m]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX();
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY();
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ();
						break;
					}
				}
				// If virtual workspace is selected update it:
				if (document.getElementById("debugVirtualWorkspace").style.visibility != "hidden"){
					var rototranslatedPosition = arg.toVector();
					if (_context == "2d"){
						// from Page coordinate system reference [in meters - (0,0,z): top-left corner of the web page]:
						var windowBorder = (window.outerWidth - window.innerWidth)/2;
						var statusBar = 0;
						if (document.getElementById("status-bar"))
							if (document.getElementById("status-bar").boxObject.height)
								statusBar = document.getElementById("status-bar").boxObject.height;
						var xOffset = (window.screenLeft + windowBorder - window.pageXOffset) * _pixelWidth;
						var yOffset = (window.screenTop + window.outerHeight - window.innerHeight - windowBorder - statusBar - window.pageYOffset) * _pixelWidth;
						// to Screen coordinate system reference [in meters - (0,0,z): top-left corner of the screen]:
						rototranslatedPosition.xTranslate(xOffset);
						rototranslatedPosition.yTranslate(yOffset);
						// to Workspace coordinate system reference [in meters - (0,0,0): center of the physical workspace]:
						rototranslatedPosition.xTranslate(-screen.width/2 * _pixelWidth);
						rototranslatedPosition.yTranslate(-screen.height/2 * _pixelWidth);
						rototranslatedPosition.xRotate(180);
					}
					_virtualWorkspace.updatePosition(rototranslatedPosition);
				}
				break;
			case "force":	//	[N]
				for (var i=0; i<3; i++){
					// Checks if these values have to be displayed:
					switch (document.getElementById("debugSelect"+i).value){
					case "Force values output [N]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX();
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY();
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ();
						break;
					}
				}
				// If virtual workspace is selected update it:
				if (document.getElementById("debugVirtualWorkspace").style.visibility != "hidden"){
					var rotatedForce = arg.toVector();
					if (_context == "2d"){
						rotatedForce.xRotate(180);
					}
					_virtualWorkspace.updateForce(rotatedForce);
				}
				break;
			case "forceInput":  //[N]
				for (var i=0; i<3; i++){
					// Checks if these values have to be displayed:
					switch (document.getElementById("debugSelect"+i).value){
					case "Force values input [N]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX();
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY();
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ();
						break;
					}
				}
				break;
			case "speed":	//	[m/ms]
				for (var i=0; i<3; i++){
					// Checks if these values have to be displayed:
					switch (document.getElementById("debugSelect"+i).value){
					case "Speed values [cm/s]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX() * 100 * 1000;
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY() * 100 * 1000;
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ() * 100 * 1000;
						break;
					case "Speed values [pixel/ms]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX() / _pixelWidth;
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY() / _pixelWidth;
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ() / _pixelWidth;
						break;
					}
				}
				break;
			case "acceleration":	//	[m/ms^2]
				for (var i=0; i<3; i++){
					// Checks if these values have to be displayed:
					switch (document.getElementById("debugSelect"+i).value){
					case "Acceleration values [cm/s^2]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX() * 100 * 1000000;
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY() * 100 * 1000000;
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ() * 100 * 1000000;
						break;
					case "Acceleration values [pixel/ms^2]:":
						document.getElementById("debugCoord"+i+"X").value = arg.toVector().getX() / _pixelWidth;
						document.getElementById("debugCoord"+i+"Y").value = arg.toVector().getY() / _pixelWidth;
						document.getElementById("debugCoord"+i+"Z").value = arg.toVector().getZ() / _pixelWidth;
						break;
					}
				}
				break;
			case "msg":
				var today = new Date();
				var time = new String( ( today.getHours() < 10 ? "0" + today.getHours() : today.getHours() ) + ":" +
						( today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes() ) + ":" +
						(today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds() ) );
				//var messageBoxContainer = document.getElementById("debugConsole");
				_messageBox.addMessage("<span style='color:#6d6e6e' >"+time+"</span>"+"<span style='color:#000000'>"+" - "+arg+"\n"+"</span>");
				break;
			case "error":
				var today = new Date();
				var time = new String( ( today.getHours() < 10 ? "0" + today.getHours() : today.getHours() ) + ":" +
						( today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes() ) + ":" +
						(today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds() ) );
				//var messageBoxContainer = document.getElementById("debugConsole");
				_messageBox.addMessage("<span style='color:#6d6e6e' >"+time+"</span>"+"<span style='color:#e30202'>"+" - "+arg+"\n"+"</span>", "#fceaea");
				break;
			case "warning":
				var today = new Date();
				var time = new String( ( today.getHours() < 10 ? "0" + today.getHours() : today.getHours() ) + ":" +
						( today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes() ) + ":" +
						(today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds() ) );
				//var messageBoxContainer = document.getElementById("debugConsole");
				_messageBox.addMessage("<span style='color:#6d6e6e' >"+time+"</span>"+"<span style='color:#f09e01'>"+" - "+arg+"\n"+"</span>", "#f9f4ca");
				break;
			case "inspect":
				_messageBox.addInspector(arg);
				break;
			case "trace":
				var today = new Date();
				var time = new String( ( today.getHours() < 10 ? "0" + today.getHours() : today.getHours() ) + ":" +
						( today.getMinutes() < 10 ? "0" + today.getMinutes() : today.getMinutes() ) + ":" +
						(today.getSeconds() < 10 ? "0" + today.getSeconds() : today.getSeconds() ) );
				_messageBox.addMessage("<span style='color:#6d6e6e' >"+time+"</span>"+"<span style='color:#3f4e60'>"+" - Current stacktrace: "+
						(getStackTrace()? getStackTrace() : "undefined")+"\n"+"</span>", "#f0efef");
				break;	
			case "graph":
				// graph objects, instead, need to be updated continuously when rendering loop is active
				// in order to maintain a correct history of values:
				_forceGraphX.update(arg.toVector().getX());
				_forceGraphY.update(arg.toVector().getY());
				_forceGraphZ.update(arg.toVector().getZ());
				break;
			case "context":
				_context = arg;
				_virtualWorkspace.updateContext(arg);
				break;
			case "deviceRefresh":
				var debugRefresh = document.getElementById('debugDeviceRefresh').firstChild;
				var newValue = arg + (arg < 1000 ? "ms" : "s");
				if (debugRefresh.nodeValue != newValue) debugRefresh.nodeValue = newValue;
				break;
			default:
				throw "invalidDebugCmdException";
			}
	}
}