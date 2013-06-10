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
 * Manages a little GUI  that allows to easily  fire functions on variables' value change.
 * @param {HTMLElement} GUI container;
 * @param {String} orientation: minimizing direction of the panel ('right' / 'top');
 * @author Andrea Guarinoni
 */
jhaptic.ControlGUI = function(container, orientation){
	var _controlGUIul, _controlGUIli;
	var _openAnimationTimer, _closeAnimationTimer;
	
	var _controlGUIdiv = document.createElement("div");
	container.appendChild(_controlGUIdiv);
	with (_controlGUIdiv.style){
		position = "absolute";
		top = "0px";
		right = "0px";
		left = "auto";
		bottom = "0px";
		width = "100%";
		height = "100%";
		background = "#1A1A1A";
		borderLeft = "3px solid #1A1A1A";
		filter = "alpha(opacity=90)";
		mozOpacity = "0.9";
		opacity = "0.9";
		borderRadius = "0px 6px 6px 0px";
		mozBorderRadius = "0px 6px 6px 0px";
		webkitBorderRadius = "0px 6px 6px 0px";
	}
	_controlGUIul = document.createElement("ul");
	_controlGUIdiv.appendChild(_controlGUIul);
	with (_controlGUIul.style){
		listStyle = "none";
		position = "absolute";
		top = "0px";
		right = "0px";
		left = "0px";
		overflowY = "hidden";
		overflowX = "auto";
		padding = "0px 0px 0px 0px";
		margin = "1px 0px 1px 0px";
	}
	// the hide/restore button:
	var _openCloseDiv = document.createElement("div");
	_controlGUIdiv.appendChild(_openCloseDiv);
	if (orientation == "right"){
		//_openCloseDiv.style.lineHeight = _openCloseDiv.clientHeight;
		with (_openCloseDiv.style){
			position = "absolute";
			height = "100%";
			width = "18px";
			top = "0px";
			left = "-18px";
			right = "auto";
			bottom = "auto";
			cursor = "pointer";
			backgroundColor = "#111";
			color = "#ffffff";
			font = "9pt Calibri";
			textAlign = "center";
			filter = "alpha(opacity=90)";
			mozOpacity = "0.9";
			opacity = "0.9";
			mozBorderRadius = "6px 0px 0px 6px";
			webkitBorderRadius = "6px 0px 0px 6px";
			borderRadius = "6px 0px 0px 6px";
			webkitBoxShadow = "-3px 0px 10px rgba(74, 85, 112, 0.8)";
			mozBoxShadow = "-3px 0px 10px rgba(74, 85, 112, 0.8)";
			boxShadow = "-3px 0px 10px rgba(74, 85, 112, 0.8)";
		}
		var _openCloseSpan = document.createElement("span");
		_openCloseDiv.appendChild(_openCloseSpan);
		with (_openCloseSpan.style){
			position = "absolute";
			top =	"40%";
			textShadow = "rgba(74, 85, 112, 0.8) 3px -3px 7px";
		}
		_openCloseSpan.appendChild(document.createTextNode("\u232a")); // '-->'
		_openCloseDiv.addEventHandler("click", function(){
			// if we have to hide the panel:
			if (_openCloseSpan.firstChild.nodeValue == "\u232a"){
				_openCloseSpan.firstChild.nodeValue = "\u2329"; // '<--'
				//_controlGUIdiv.style.display = "block";
				clearTimeout(_openAnimationTimer);
				_closeAnimationTimer = setInterval(function(){
					_controlGUIdiv.style.width = (parseInt(_controlGUIdiv.style.width) - 10) + "%";
					if (parseInt(_controlGUIdiv.style.width) <= 0){
						clearTimeout(_closeAnimationTimer);
						with(_openCloseDiv.style){
							borderRadius = "6px 6px 6px 6px";
							mozBorderRadius = "6px 6px 6px 6px";
							webkitBorderRadius = "6px 6px 6px 6px";	
						}
					}
					}.bind(this),10);
			}
			// if we have to restore the panel:
			else {
				_openCloseSpan.firstChild.nodeValue = "\u232a";
				clearTimeout(_openAnimationTimer);
				with(_openCloseDiv.style){
					borderRadius = "6px 0px 0px 6px";
					mozBorderRadius = "6px 0px 0px 6px";
					webkitBorderRadius = "6px 0px 0px 6px";
				}
				_openAnimationTimer = setInterval(function(){
					_controlGUIdiv.style.width = (parseInt(_controlGUIdiv.style.width) + 10) + "%";
					if (parseInt(_controlGUIdiv.style.width) >= 100){
						clearTimeout(_openAnimationTimer);
					}
					}.bind(this),10);
			}
		}.bind(this));
	}
	else /* default: 'top' */ {
		with (_openCloseDiv.style){
			width = "100%";
			height = "18px";
			backgroundColor: "#111";
			color = "#ffffff";
			font = "7pt Calibri";
		}
		_openCloseDiv.appendChild(document.createTextNode("Open Options"));	
	}
	
	_openCloseDiv.addEventHandler('mouseover', function(e){
		(e.target || e.srcElement).style.backgroundColor = "#1d1d1d";
			});
	_openCloseDiv.addEventHandler('mouseout', function(e){
		(e.target || e.srcElement).style.backgroundColor = "#111";
			});

	/**
	 * Create a blank control;
	 * @param {String} title: the title of the control;
	 */
	this.createTitleControl = function(title, borderColor){
		_controlGUIli = document.createElement("li");
		_controlGUIli.id = title;
		_controlGUIul.appendChild(_controlGUIli);
		_controlGUIli.style.borderLeft = "3px solid " + ( borderColor || "#2FA1D6" );
		_controlGUIli.style.width = (parseInt(container.style.width) - 3) + "px";
		with (_controlGUIli.style){
			color = "#EEE";
			borderBottom = "1px solid #2C2C2C";
			overflow = "hidden";
			//width = "100%";
			float = "right";
			cursor = "default";
		}
		var controlGUIspan = document.createElement("span");
		_controlGUIli.appendChild(controlGUIspan);
		var text = document.createTextNode(title);
		controlGUIspan.appendChild(text);
		with (controlGUIspan.style){
			padding = "0px 3px 0px 3px";
		}
	}
	
	/**
	 * Create a control that allows to fire a function when a slider is moved;
	 * @param {String} title: the title of the control;
	 * @param {Function} handler: the function that will be executed whenever the status of the
	 *                            control changes, the first argument received from the 'handler' is
	 *                            the current value of the slider;
	 * @param {Number} minValue: the minimum value of the slider;
	 * @param {Number} maxValue: the maximum value of the slider;
	 * @param {String} borderColor: (optional) the right border color of the control;
	 */
	this.createSliderControl = function(title, handler, minValue, maxValue, borderColor){
		this.createTitleControl(title, borderColor);
		var controlGUIslider = document.createElement("input");
		controlGUIslider.id = "debugVirtualWorkspaceControlGUIslider";
		// 'range' input type is an html5 feature, so we will try to create it
		// only if the browser support is available:
		try{
			controlGUIslider.type = "range";
		}
		catch(error){
			if (error){
				_controlGUIli.appendChild(document.createTextNode("Not Supported"));
				return;
			}
		}
		controlGUIslider.min = minValue || 0;
		controlGUIslider.max = maxValue || 100;
		controlGUIslider.value = 0;
		_controlGUIli.appendChild(controlGUIslider);
		with (controlGUIslider.style){
			webkitAppearance = "none";
	    	backgroundColor = "#434548";
	    	height = "10px";
	    	width = "85px";
	    	overflow = "hidden";
	    	cursor = "w-resize";
		}
		// set the onChange handler:
		if (handler instanceof Function){
			controlGUIslider.addEventHandler("change", function(e){
				var newValue;
				newValue = (e.target) ? e.target.value : e.srcElement.value;
				handler(newValue);
				});
		}
	}

	/**
	 * Create a control that allows to fire a function when a checkbox is selected/unselected;
	 * @param {String} title: the title of the control;
	 * @param {Function} handler: the function that will be executed whenever the status of the
	 *                            control changes, the first argument received from the 'handler' is
	 *                            the current value of the checkbox;
	 * @param {String} borderColor: (optional) the right border color of the control;
	 */
	this.createBooleanControl = function(title, handler, borderColor){
		this.createTitleControl(title, borderColor);
		var controlGUIcheckbox = document.createElement("input");
		controlGUIcheckbox.type = "checkbox";
		_controlGUIli.appendChild(controlGUIcheckbox);
		with (controlGUIcheckbox.style){
			position = "absolute";
			right = "3px";
			margin = "0px 0px 0px 0px";
			overflow = "hidden";
			cursor = "pointer";
		}
		// set the onChange handler:
		if (handler instanceof Function){
			controlGUIcheckbox.addEventHandler("change", function(e){
				var newValue;
				newValue = (e.target) ? e.target.checked : e.srcElement.checked;
				handler(newValue);
				});
		}
	}
	
	/**
	 * Create a control that allows to monitor the content of a variable;
	 * @param {String} title: the title of the control;
	 * @param {String} variableId: the pseudo-name of the variable to monitor, to refresh
	 *                             the variable value that has to be displayed  simply add in your code
	 *                             '{controlGUI}.variableMonitor.updateVariableId(newValue)'
	 *                             whenever you modify the variable content, note that '..VariableId..'
	 *                             is the string you've passed;
	 * @param {String} borderColor: (optional) the right border color of the control;
	 */
	this.createVariableMonitor = function(title, variableId, borderColor){
		this.createTitleControl(title, borderColor);
		if  ( ! ( this.variableMonitor ) ){
			this.variableMonitor = {};
		}	
		var controlGUIspan = document.createElement("span");
		_controlGUIli.appendChild(controlGUIspan);
		var text = document.createTextNode("undefined");
		controlGUIspan.appendChild(text);
		with (controlGUIspan.style){
			padding = "0px 3px 0px 3px";
			fontStyle = "italic";
		}
		eval("this.variableMonitor.update" + variableId + " = function(value){ text.nodeValue = value.toString(); }");
		// 'text' variable will be accessed thanks to closure chain.
	}
	
	/**
	 * Remove a control previously added to the panel;
	 * @param {String} title: the title of the control that has to be removed from the GUI;
	 */
	this.removeControl = function(title){
		if (document.getElementById(title)){
			_controlGUIul.removeChild(document.getElementById(title));
		}
	}
}