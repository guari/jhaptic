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
 * Defines a graph as an array of scaled values that fits in graph width and height providing methods to manage it;
 * @param {HTMLElement}canvas: canvas element on which will be drawn the contents;
 * @param {Number}refreshInterval: update interval of the graph [measured in milliseconds];
 * @author Andrea Guarinoni
 */
jhaptic.Graph = function(canvas, refreshInterval){
	/**
	 * @constructor
	 */
	/*Private variables:--------------------------------------------------------------------------------------------------------*/
	// The canvas element on which we will draw:
	var _canvas;
	// ...and the context in which we will use the canvas element:
	var _context;
	// Verifies that the element passed is a canvas:
	if (canvas.nodeName=="CANVAS"){
		_canvas = canvas;
	}
	else throw "ElementIsNotACanvasException";
	// The update interval of the graph:
	var _refreshInterval;
	if (isNaN(refreshInterval)){
		throw "RefreshIntervalIsNotANumberException";
	}
	else _refreshInterval = refreshInterval;
	// Array that contains the real values that need to be plotted in the graph:
	var _realValues;
	// Array that contains the scaled values for the graph to be plotted:
	var _graphValues;
	// Here we store the module of the current peak value of the array _realValues:
	var _peakValue;
	// These are to define graph margins into the canvas element (layout):
	var _graphMarginTop = 0;
	var _graphMarginLeft = 30;
	var _graphMarginRight = 0;
	var _graphMarginBottom = 0;
	// The width of the graph in pixel (also matches the number of samples on x-axis):
	var _graphWidth;
	// The height of the graph in pixel:
	var _graphHeight;
	// the following is used to avoid the rendering of unnecessary frames:
	var _lastFrameTime;
	
	setGraphWidth(_canvas.clientWidth);
	setGraphHeight(_canvas.clientHeight);

	// Initializes the array used to store force values 'history':
	_realValues = new Array(_graphWidth);
	for (var i=0; i<_realValues.length; i++){
		_realValues[i]=0;
	}
	// Initializes the array used to store graph values 'history':
	_graphValues = new Array(_graphWidth);
	for (var i=0; i<_graphValues.length; i++){
		_graphValues[i]=0;
	}
	// and get the context in which we will use the _canvas:
	if (_canvas.getContext) _context = _canvas.getContext('2d');
	
	/******************************************************************/
	/* This is an hack to force GPU hardware acceleration on canvas element in WebKit: */
	_canvas.style.webkitTransform = "translateZ(0)";
	/******************************************************************/
	
	/* Private methods:-----------------------------------------------------------------------------------------------*/
	
	/**
	 * Wrapper for 'requestAnimationFrame';
	 */
	var requestAnimFrame = (function(){
	      return  window.requestAnimationFrame       || 
	              window.webkitRequestAnimationFrame || 
	              window.mozRequestAnimationFrame    || 
	              window.oRequestAnimationFrame      || 
	              window.msRequestAnimationFrame     || 
	              function(/* function */ callback, /* DOMElement */ element){
	                window.setTimeout(callback, 1000 / 60);
	              };
	    })();
	
	/**
	 * Sets graph width;
	 * @param {Number} newWidth: the width of the canvas to be set;
	 */
	function setGraphWidth(newWidth){
		_graphWidth = newWidth - _graphMarginLeft - _graphMarginRight;
		// the following line is needed due to an incorrect handling of the size of the canvas that is different
		// between css (canvas.clientWidth and/or css width to 100%) and html (canvas.width),
		// without this line the canvas will be stretched and showed only for a part:
		_canvas.width = newWidth;
	}

	/**
	 * Sets graph height;
	 * @param {Number} newHeight: the height of the canvas to be set;
	 */
	function setGraphHeight(newHeight){
		_graphHeight = newHeight - _graphMarginTop - _graphMarginBottom;
		// the following line is needed due to an incorrect handling of the size of the canvas that is different
		// between css (canvas.clientHeight and/or css height to 100%) and html (canvas.height),
		// without this line the canvas will be stretched and showed only for a part:
		_canvas.height = newHeight;
	}
	
	/**
	 * Draws a background on the current canvas:
	 */
	function renderBackground() {
		_context.fillStyle = 'white';
		_context.fillRect(0, 0, _canvas.clientWidth, _canvas.clientHeight);
	    var lingrad = _context.createLinearGradient(_graphMarginLeft, _graphMarginTop, (_graphWidth+_graphMarginLeft), (_graphHeight+_graphMarginTop));
	    lingrad.addColorStop(0.0, '#D4D4D4');
	    lingrad.addColorStop(0.2, '#fff');
	    lingrad.addColorStop(0.8, '#fff');
	    lingrad.addColorStop(1, '#D4D4D4');
	    _context.fillStyle = lingrad;
	    _context.fillRect(_graphMarginLeft, _graphMarginTop, (_graphWidth+_graphMarginLeft), (_graphHeight+_graphMarginTop));
	    _context.fillStyle = 'black';
	}
	
	/**
	 * Draws a line on the canvas from point (startX, startY) to point (endX, endY);
	 * @param {Number} startX: pixel coordinate referred to canvas;
	 * @param {Number} startY: pixel coordinate referred to canvas;
	 * @param {Number} endX: pixel coordinate referred to canvas;
	 * @param {Number} endY: pixel coordinate referred to canvas;
	 * @param {String} strokeStyle: line color, a string containing any command valid for browser (name, rgb, gradient...);
	 * @param {Number} lineWidth: the width in pixel of the line to draw;
	 * @private
	 */
	function drawLine(startX, startY, endX, endY, strokeStyle, lineWidth) {
	    if (strokeStyle != null) _context.strokeStyle = strokeStyle;
	    if (lineWidth != null) _context.lineWidth = lineWidth;
	    _context.beginPath();
	    _context.moveTo(startX, startY);
	    _context.lineTo(endX, endY);
	    _context.stroke();
	    _context.closePath();
	}
	
	/**
	 * Renders labels for coordinates on x and y axis;
	 * @private
	 */
	function renderLabels(){
		_context.font = '7pt Calibri';
		// draws labels for y-axis:
		var txtSize;
		if (_peakValue != 0){
		var step = Math.round(_graphHeight/4);
		// stores into the array yLabels the values that we will draw as reference lines in the graph:
		yLabels = new Array(Math.round(_peakValue*100)/100, Math.round(_peakValue/2*100)/100, 0, Math.round(-_peakValue/2*100)/100, Math.round(-_peakValue*100)/100);
		var y;
			for (var i=0; i<yLabels.length; i++){
				txtSize = _context.measureText(yLabels[i]);
				if (i==0){
					y= _graphMarginTop + 7;
				}
				else if (i==yLabels.length - 1){
					y=_graphMarginTop + (step * i) - 2;
				}
				else{
					y=Math.round(_graphMarginTop + (step * i) + (7 / 2));
				}
				_context.fillText( yLabels[i], _graphMarginLeft - (txtSize.width) - 2, y);
				drawLine.call(this, (_graphMarginLeft-1), step*i, (_graphWidth+_graphMarginLeft), step*i, '#bdbcbc', 1);
			}
		}
		else {
			txtSize = _context.measureText(_peakValue);
			_context.fillText( _peakValue, _graphMarginLeft - (txtSize.width) - 2, _graphMarginTop + _graphHeight/2 + (7/2));
		}
		// draws labels for x-axis:
		_context.font = '8pt Calibri';
		// calculates the monitored time according to the refresh interval of the device and the current browser window width:
		var time = _graphWidth*_refreshInterval;
		var timeUnit = "ms";
		if (time > 1000){
			time = time / 1000;
			timeUnit = "s";
		}
		var txt = "Monitored Time: " + time + timeUnit;
		txtSize = _context.measureText(txt);
		_context.fillText( txt, Math.round(_graphWidth/2 + _graphMarginLeft - txtSize.width/2), _graphMarginTop + 10);
	}
	
	/**
	 * Draws the current graph on the canvas
	 * (the top-left angle of the canvas has coordinate (0,0)
	 * the bottom-right is (.clientWidth, .clientHeight))
	 * @private
	 */
	function drawGraph(){
         // draws the background:
         renderBackground.call(this);
         // draws x-axis:
         drawLine.call(this, (_graphMarginLeft-1), Math.round(_graphHeight/2), (_graphWidth+_graphMarginLeft), Math.round(_graphHeight/2), 'black', 1);
         // draws y-axis:
         drawLine.call(this, _graphMarginLeft, _graphMarginTop, _graphMarginLeft, (_graphMarginTop+_graphHeight), 'black', 1);
         // renders text labels for x and y axis:
         renderLabels.call(this);
         // and finally draws the values stored into _graphValues:
         var x1, y1, x2, y2;
         for (var i=0; i<_graphValues.length-1; i++){
        	x1 = _graphMarginLeft + i;
        	y1 = Math.round(-_graphValues[i] + _graphMarginTop + (_graphHeight/2));
        	x2 = _graphMarginLeft + (i+1);
        	y2 = Math.round(-_graphValues[i+1] + _graphMarginTop + (_graphHeight/2));
        	drawLine.call(this, x1, y1, x2, y2, '#940101', 1);
         }
	}
	
	function animate(){
		requestAnimFrame( animate.bind(this) );
		// if the canvas is visible then draws (refreshes) the graph:
		if (_canvas.style.visibility != "hidden"){
			// re-draw the canvas only after '_refreshInterval' ms
			// to limit bad performance on low-end computers:
			var currentTime = new Date().getTime();
			var delta = currentTime - _lastFrameTime;
			if (delta >= refreshInterval){
				_lastframeTime = currentTime;
				// updates the array _graphValues by scaling it as it should:
				// resets graphValues in case graphWidth is changed, garbage collector will do the rest:
				_graphValues = new Array();
				_peakValue = Math.max(_realValues.maxValue(), Math.abs(_realValues.minValue()));
				if (_peakValue != 0){
					for (var x=0; x<_realValues.length; x++){
						_graphValues.push(Math.round((_realValues[x]) * (_graphHeight/2) / _peakValue));
					}
				}
				else {
					for (var i=0; i<_realValues.length; i++){
						_graphValues[i]=0;
					}
				}
				drawGraph.call(this);
			}
		}
	}
	
	_lastFrameTime = new Date().getTime();
	animate.call(this);
	
	/* Privileged methods:-----------------------------------------------------------------------------------------------*/
	/**
	 * Updates graph values by inserting a new one into the array _realValues,
	 * this method also updates the values in order to fit the width and height of the graph,
	 * if the canvas is visible it also draws the graph;
	 * @param {Number} value: the value to insert into _graphValues;
	 */
	this.update = function(value){
		// updates _graphWidth and _graphHeight in case the user has changed the size of the browser window:
		if (_canvas.clientHeight != _canvas.height){
			setGraphHeight(_canvas.clientHeight);
		}
		if (_canvas.clientWidth != _canvas.width){
			setGraphWidth(_canvas.clientWidth);
			// checks if graphWidth is changed and, if so, shifts realValues:
			if (_realValues.length > _graphWidth){
				// the graph was shrunk:
				while (_realValues.length != _graphWidth){
					// removes the oldest values to fit the new width:
					_realValues.shift();
				}
			}
			else if (_realValues.length < _graphWidth){
				// the graph was expanded:
				while (_realValues.length != _graphWidth){
					// adds values to fit the new width:
					_realValues.unshift(new Number(0));
				}
			}
		}
		// removes the first element of the array (the oldest) and shifts it:
		_realValues.shift();
		// and adds the new value in the last position:
		_realValues.push(new Number(value));
		
	}
}