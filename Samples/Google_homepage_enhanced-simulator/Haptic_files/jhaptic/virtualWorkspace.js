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
 * Manages a graphical representation of the workspace;
 * @param {HTMLElement} containerDiv: a reference to the DIV in which it is drawn the virtual workspace;
 * @param {Number} maxForce: the maximum force that the device is able to render [N];
 * @param {Vector} workspaceSize: workspace dimensions (Wide x High x Deep) [m];
 * @author Andrea Guarinoni
 */
jhaptic.VirtualWorkspace = function(containerDiv, maxForce, workspaceSize){
	/**
	 * @constructor
	 */
	/*Private variables:--------------------------------------------------------------------------------------------------------*/
	// The canvas element on which we will draw:
	var _mainCanvas;
	// ...and the context in which we will use the canvas element:
	var _context;
	// the div used as container for the canvas element:
	var _containerDiv;
	
	// Verifies that the element passed is a DIV:
	if (containerDiv.nodeName=="DIV"){
		_containerDiv = containerDiv;
	}
	else throw "ElementIsNotADivException";
	
	var _maxForce;
	// Verifies that maxForce is a Number:
	if (isNaN(maxForce)){
		throw "maxForceIsNotANumberException";
	}
	else _maxForce = maxForce;
	
	var _workspaceSize = new jhaptic.Vector(0,0,0);
	// Verifies that workspaceSize is a Vector:
	if (workspaceSize instanceof jhaptic.Vector){
		_workspaceSize.setVector(workspaceSize);
	}
	else throw "workspaceSizeIsNotAVectorException";
	
	// To store current input/output variables that have to be rendered graphically:
	var _currentForce = new jhaptic.Vector(0,0,0);
	var _currentPosition = new jhaptic.Vector(0,0,0);
	var _previousForce = new jhaptic.Vector();
	// and the current context id:
	var _currentContext = String("undefined");
	
	// These are to define the internal margins for the canvas element (layout):
	var _marginTop = 5;
	var _marginLeft = 10;
	var _marginRight = 10;
	var _marginBottom = 5;
	var _barWidth = 25;
	var _barOffsetX = 10;
	
	var _internalWidth;
	var _internalHeight;
	
	// These are used to render the 3d scene:
	//var _scaleIndex = 0.0840336;
	var _renderer, _camera, _scene;
	var _workspaceBorder, _workspaceGeo, _plane, _labels;
	var _positionPoint, _positionSphere;
	var _forceVersor, _forceArrow, _forceAxes;
	var _desktopBordersGeo, _viewportBordersGeo;
    var _positionXAxis, _positionYAxis, _positionZAxis;
	var _displayForceAxes = false;
	var _displayViewportBorders = false;
	// This is for the little GUI on the right side:
	var _optionPanel;
	// for passing from meters unit to pixels unit (fitting the height of the canvas):
	var _conversionIndex;
	// for passing from pixels unit to meters unit (fitting the size of the screen):
	var _pixelWidth;

	// for workspace movements:
	var targetRotation = 0;
	var targetRotationOnMouseDown = 0;
	var mouseX = 0;
	//var mouseY = 0;
	var mouseXOnMouseDown = 0;
	//var windowHalfX = window.innerWidth / 2;
	var windowHalfX = _containerDiv.clientWidth / 2;
	var _perspectiveAngle = 0;
	//var viewportHalfY = _containerDiv.clientHeight / 2;
	
	/* Private methods:-----------------------------------------------------------------------------------------------*/
	
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
	 * Sets internal width ;
	 * @param {Number} newWidth: the width of the canvas to be set;
	 */
	function setSize(newWidth, newHeight){
		_internalWidth = newWidth - _marginLeft - _marginRight;
		_internalHeight = newHeight - _marginTop - _marginBottom;
		// the following lines are needed due to an incorrect handling of the size of the canvas that is different
		// between css (eg. canvas.clientWidth and/or css width to 100%) and html (eg. canvas.width),
		// without this two lines the canvas will be stretched and showed only for a part:
		_mainCanvas.width = newWidth;
		_mainCanvas.height = newHeight;
		// then resize the canvas used to draw 3d elements:
		var offsetX = _marginLeft+65;
		var viewportWidth = _mainCanvas.clientWidth-offsetX;
		var viewportHeight = _mainCanvas.clientHeight;
		_camera.aspect = viewportWidth / viewportHeight;
		_camera.updateProjectionMatrix();	
		_renderer.setSize( _mainCanvas.clientWidth-_marginLeft-65, _mainCanvas.clientHeight );
	}
	
	/**
	 * Draw canvas background;
	 */
	function drawBackground(){
		// right portion background:
        _context.fillStyle = '#2b2b2b';
        var lingrad = _context.createLinearGradient(_marginLeft+65, 0, _mainCanvas.clientWidth, _mainCanvas.clientHeight);
 	    lingrad.addColorStop(0.0, '#000000');
 	    lingrad.addColorStop(0.2, '#2b2b2b');
 	    lingrad.addColorStop(0.8, '#2b2b2b');
 	    lingrad.addColorStop(1, '#000000');
 	    _context.fillStyle = lingrad;
        _context.fillRect(0, 0, _mainCanvas.clientWidth, _mainCanvas.clientHeight);
        // left portion background:
        _context.fillStyle = 'black';
        _context.fillRect(0, 0, _marginLeft+_barOffsetX+_barWidth+30, _mainCanvas.clientHeight);
	}
	
	/**
	 * Draw labels for force bar indicator;
	 */
	function drawBarLabels(){
		// draw text:
        _context.font = 'bold 9pt Calibri';
		_context.fillStyle = 'white';
		_context.save();
		_context.rotate(-Math.PI/2);
		_context.textAlign = "center";
		_context.fillText("Force Amplitude", (_internalHeight/2) *-1, _marginLeft+5);
		_context.restore();
		_context.font = '7pt Calibri';
		_context.fillText('0.0N', _marginLeft+_barOffsetX+_barWidth+2, _internalHeight+2);
		_context.fillText(maxForce/2+'N', _marginLeft+_barOffsetX+_barWidth+2, _internalHeight/2+2);
		_context.fillText(maxForce+'N', _marginLeft+_barOffsetX+_barWidth+2, _marginTop+8);

	}
	
	/**
	 * Draw current force bar level;
	 */
	function drawForceLevel(){
		// barHeight is equal to _internalHeight
		// draw background bar:
		var lingrad = _context.createLinearGradient(0,0,0,_internalHeight);
		lingrad.addColorStop(0, '#69696f');
		lingrad.addColorStop(0.6, '#39393d');
		lingrad.addColorStop(0.8, '#29292c');
		_context.fillStyle = lingrad;
		_context.fillRect( _marginLeft+_barOffsetX, _marginTop, _barWidth, _internalHeight);
		// compute current force level to draw:
 		var levelHeight = _internalHeight*_currentForce.getMagnitude()/_maxForce;
		// draw current bar level:
		var lingrad = _context.createLinearGradient(0,0,50,0);
		lingrad.addColorStop(0.2, '#a0ccf5');
		lingrad.addColorStop(0.5, '#79b8f2');
		lingrad.addColorStop(0.8, '#564af5');
		_context.fillStyle = lingrad;
		_context.fillRect(_marginLeft+_barOffsetX, _internalHeight+_marginTop, _barWidth, -levelHeight);
	}
	
	/**
	 * Create a canvas containing the specified text;
	 * @return {HTMLCanvasElement}
	 */
	function createTextCanvas(text, color, font, size) {
        size = size || 24;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var fontStr = (size + 'px ') + (font || 'Arial');
        ctx.font = fontStr;
        var w = ctx.measureText(text).width;
        var h = Math.ceil(size);
        canvas.width = w;
        canvas.height = h;
        ctx.font = fontStr;
        ctx.fillStyle = color || 'black';
        ctx.fillText(text, 0, Math.ceil(size*0.8));
        return canvas;
      }

	/**
	 * Create a bidimensional text label
	 * @param text
	 * @param color
	 * @param font
	 * @param size
	 * @param segW
	 * @param segH
	 * @returns {THREE.Mesh}
	 */
      function createText2D(text, color, font, size, segW, segH) {
        var canvas = createTextCanvas(text, color, font, size);
        var plane = new THREE.PlaneGeometry(canvas.width, canvas.height, segW, segH);
        var tex = new THREE.Texture(canvas);
        tex.needsUpdate = true;
        var planeMat = new THREE.MeshBasicMaterial({
          map: tex, color: 0xffffff, transparent: true
        });
        var mesh = new THREE.Mesh(plane, planeMat);
        mesh.scale.set(0.25, 0.25, 0.25);
        mesh.doubleSided = true;
        return mesh;
      }
	
	/**
	 * Initialize the 3d scene by creating all the elements needed;
	 * @private
	 */
	function init() {
		// set the scene size:
		var offsetX = _marginLeft+65;
		var viewportWidth = _mainCanvas.clientWidth-offsetX;
		var viewportHeight = _mainCanvas.clientHeight;
		var aspect = viewportWidth / viewportHeight;
		// set some camera attributes:
		var viewAngle = 10;
		var near = 1;
		var far = 10000;
		
		try {   
		    // first, try to use standard WebGL context:
			_renderer = new THREE.WebGLRenderer({ antialias:true });
		}
		catch (error){
			if (error){
				try{
					showMessage("warn", "Virtual Workspace: Unable to initialize  WebGL context. Your browser may not support it.");
					showMessage("log", "Virtual Workspace: Trying to use Canvas renderer...");
					// if failed, try to use the canvas one:
					_renderer = new THREE.CanvasRenderer();
					showMessage("log", "Virtual Workspace: Using Canvas renderer. For best experience please update your browser or use one that support GL context.");
				}
				catch (error){
					if (error) {
						// If we don't have a valid graphic context, give up now:
						showMessage("error", "Virtual Workspace: Unable to initialize a valid graphic context. Update your browser to use JHaptic console.");
					}
				}
			}
		}
		_scene = new THREE.Scene();
		
		// setup camera:
		_camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
		// the camera starts at 0,0,0 so pull it back:
		_camera.position.y = 150;
		_camera.position.z = 750;
		_scene.add(_camera);
		
	      //_scene.fog = new THREE.FogExp2( 0x000000, 0.0010 );
		
		// Workspace Cube:
		var workspaceY = viewportHeight;
		var workspaceX = (workspaceY * _workspaceSize.getX()) / _workspaceSize.getY();
		var workspaceZ = (workspaceY * _workspaceSize.getZ()) / _workspaceSize.getY();
		_conversionIndex = workspaceX / _workspaceSize.getX();  // [ pixel/meter ]
		
		var material = new THREE.MeshPhongMaterial( { color: 0x808080, wireframe:false, wireframeLinewidth:1, opacity:0.7, blending :THREE.AdditiveBlending/*, depthTest:false*/,transparent:true/*, reflectivity:true, refractionRatio:0.5*/} );
		_workspaceGeo = new THREE.Mesh( new THREE.CubeGeometry( workspaceX, workspaceY, workspaceZ, 1, 1, 1/*, material */), /*new THREE.MeshFaceMaterial()*/ material);
		_workspaceGeo.position.y = _camera.position.y;
		_workspaceGeo.doubleSided = true;
		_workspaceGeo.overdraw = true;
		_scene.add( _workspaceGeo );
		
		// Workspace geometry borders:
		function v(x,y,z){ 
	        return new THREE.Vertex(new THREE.Vector3(x,y,z)); 
	      }
		
		// Workspace border geometry:		
		material = new THREE.MeshBasicMaterial( { color: 0x1f242f, wireframe:true, wireframeLinewidth:1 } );
		_workspaceBorder = new THREE.Mesh( new THREE.CubeGeometry( workspaceX, workspaceY, workspaceZ, 1, 1, 1), material);
	    _workspaceBorder.overdraw = true;
	    _workspaceGeo.add(_workspaceBorder);
		
		// Floor plane:
		_plane = new THREE.Mesh( new THREE.PlaneGeometry( workspaceX*4, workspaceZ*4 ), new THREE.MeshLambertMaterial( { color: 0x000000 } ) );
		_plane.rotation.x = - 90 * ( Math.PI / 180 );
		_plane.position.y = workspaceZ ;
		_plane.position.z =  -workspaceY;
		_plane.overdraw = true;
		_scene.add( _plane );
		
		// End-effector position indicator:
		_positionPoint = new THREE.Mesh(new THREE.SphereGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial({color: 0xafd8f8}) );
		_workspaceGeo.add( _positionPoint );
		var radius = 1;
		var segments = 16;
		var rings = 16;
		_positionSphere = new THREE.Mesh( new THREE.SphereGeometry( radius, segments, rings ), new THREE.MeshLambertMaterial({color: 0xafd8f8}) );
		_positionPoint.add( _positionSphere );
		// with axes:
		var lineMat = new THREE.LineBasicMaterial({
	          color: 0x2a9ef9, opacity: 0.6, lineWidth: 0.5});
		var lineGeo = new THREE.Geometry();
	    lineGeo.vertices.push(
	    		v(-workspaceX/2, 0, 0), v(workspaceX/2, 0, 0)	// x
	      );
        _positionXAxis = new THREE.Line(lineGeo, lineMat);
        _positionXAxis.type = THREE.Lines;
        _positionXAxis.overdraw = true;
        _workspaceGeo.add(_positionXAxis);
        lineGeo = new THREE.Geometry();
	    lineGeo.vertices.push(
	    		v(0, -workspaceY/2, 0), v(0, workspaceY/2, 0)	// y
	    );
	    _positionYAxis = new THREE.Line(lineGeo, lineMat);
        _positionYAxis.type = THREE.Lines;
        _positionYAxis.overdraw = true;
        _workspaceGeo.add(_positionYAxis);
        lineGeo = new THREE.Geometry();
	    lineGeo.vertices.push(
	    		v(0, 0, -workspaceZ/2), v(0, 0, workspaceZ/2)	// z
	    );
	    _positionZAxis = new THREE.Line(lineGeo, lineMat);
        _positionZAxis.type = THREE.Lines;
        _positionZAxis.overdraw = true;
        _workspaceGeo.add(_positionZAxis);
        
        // current force normalized indicator:
        lineGeo = new THREE.Geometry();
	    lineGeo.vertices.push(
	    		v(0, 0, 0), v(0, 0, 0)
	    );
	    lineMat = new THREE.LineBasicMaterial({
	          color: 0xff7171, opacity: 1, lineWidth: 5});
	    _forceVersor = new THREE.Line(lineGeo, lineMat);
        _forceVersor.type = THREE.Lines;
        _forceVersor.overdraw = true;
        _forceVersor.dynamic = true;
        _positionPoint.add(_forceVersor);
        // and the cone arrow:
        var coneHeight = 8;
        _forceArrow = new THREE.Mesh(new THREE.CylinderGeometry(0, 4, coneHeight, 20, 20, false), new THREE.MeshLambertMaterial({color: 0xff7171}));
      
        // labels for axes:
        _labels = new Array();
        _labels[0] = createText2D('-X', '#ffffff', 'Calibri',60);
        _labels[0].position.x = -(workspaceX/2 + 15);
        //_workspaceGeo.add(_labels['-x']);
        _labels[1] = createText2D('X', '#ffffff', 'Calibri',60);
        _labels[1].position.x = workspaceX/2 + 15;
        //_workspaceGeo.add(_labels['x']);
        _labels[2] = createText2D('-Y', '#ffffff', 'Calibri',60);
        _labels[2].position.y = -(workspaceY/2 + 15);
        _labels[2].rotation.x = -90*Math.PI/180;
        //_workspaceGeo.add(_labels['-y']);
        _labels[3] = createText2D('Y', '#ffffff', 'Calibri',60);
        _labels[3].position.y = workspaceY/2 + 15;
        _labels[3].rotation.x = -90*Math.PI/180;
        //_workspaceGeo.add(_labels['y']);
        _labels[4] = createText2D('-Z', '#ffffff', 'Calibri',60);
        _labels[4].position.z = -(workspaceZ/2 + 15);
        _labels[4].rotation.y = 90*Math.PI/180;
        //_workspaceGeo.add(_labels['-z']);
        _labels[5] = createText2D('Z', '#ffffff', 'Calibri',60);
        _labels[5].position.z = workspaceZ/2 + 15;
        _labels[5].rotation.y = 90*Math.PI/180;
        //_workspaceGeo.add(_labels['z']);
        
        // Calculate the size, in meters, of a pixel according to the size of the physical workspace
		// (it will be used to draw the desktop and viewport borders when using the context '2d'):
		_pixelWidth = _workspaceSize.getX() / window.screen.width;		//	[m/pixel]
		// checks if the height exceeds the size of the physical workspace, if yes then recalculates the value for _pixelWidth:
		if (_workspaceSize.getY() < (window.screen.height * _pixelWidth) ){
			_pixelWidth = _workspaceSize.getY() / window.screen.height;
		}
        
        // Desktop borders geometry used when working in the 2d context:  
        _desktopBordersGeo = new THREE.Mesh( 
				new THREE.CubeGeometry(screen.width*_pixelWidth*_conversionIndex, screen.height*_pixelWidth*_conversionIndex,_workspaceSize.getZ()*_conversionIndex,1,1,1),
				new THREE.MeshBasicMaterial( { color: 0x3384f3, wireframe:false, wireframeLinewidth:1, opacity:0.1, transparent:true}));
		_desktopBordersGeo.doubleSided = true;
		_desktopBordersGeo.overdraw = true;
		var desktopWireframeGeo = new THREE.Mesh( 
				new THREE.CubeGeometry(screen.width*_pixelWidth*_conversionIndex, screen.height*_pixelWidth*_conversionIndex,_workspaceSize.getZ()*_conversionIndex,1,1,1),
				new THREE.MeshBasicMaterial( { color: 0x1357b4, wireframe:true, wireframeLinewidth:1, opacity:1}));
		desktopWireframeGeo.doubleSided = true;
		desktopWireframeGeo.overdraw = true;
		_desktopBordersGeo.add(desktopWireframeGeo);
		var desktopWireframePlane = new THREE.Mesh( 
				new THREE.CubeGeometry(screen.width*_pixelWidth*_conversionIndex, screen.height*_pixelWidth*_conversionIndex,0,1,1,1),
				new THREE.MeshBasicMaterial( { color: 0x1357b4, wireframe:true, wireframeLinewidth:1, opacity:1}));
		desktopWireframePlane.overdraw = true;
		_desktopBordersGeo.add(desktopWireframePlane);
        
        //material.shading = THREE.SmoothShading;
        var ambient = new THREE.AmbientLight( 0x777777 );
		_scene.add( ambient );

		var spotLight = new THREE.SpotLight( 0xcccccc );
		spotLight.position.x = 0;
		spotLight.position.y = 0;
		spotLight.position.z = 500;
		spotLight.position.normalize();
		_scene.add( spotLight );
		_renderer.shadowMapEnabled = true;
		spotLight.castShadow = true;
		_workspaceGeo.castShadow = true;
	    _workspaceGeo.receiveShadow = true;
		_plane.castShadow = true;
		_plane.receiveShadow = true;
        
        
		// set canvas size:
		_renderer.setSize(viewportWidth, viewportHeight);
		// attach the render-supplied DOM element:
		_containerDiv.appendChild(_renderer.domElement);
		// set canvas position:
		with(_renderer.domElement.style){
			position = "absolute";
			left = offsetX + "px";	
		}
		

		// now build the little GUI used to modify some variables value:
		var controlGUIcontainer = document.createElement("div");
		controlGUIcontainer.id = "debugVirtualWorkspaceControlGUI";
		_containerDiv.appendChild(controlGUIcontainer);
		// set css style for _mainCanvas object:
		with (controlGUIcontainer.style){
			position = "absolute";
			top = "0px";
			left = "auto";
			right = "0px";
			bottom = "0px";
			width = "167px";
			height = "100%";
			resize = "none";
			mozBorderRadius = "6px";
			webkitBorderRadius = "6px";
			borderRadius = "6px";
			font = "9pt Calibri, sans-serif";
			textShadow = "0 -1px 0 #11";
		}
		_optionPanel = new jhaptic.ControlGUI(controlGUIcontainer, "right");
		// the panel has been created, let's fill it with the needed controls:
		// Control: set perspective height (to modify _workspaceGeo x-rotation angle):
		_optionPanel.createSliderControl("Perspective:", function(value){
			_perspectiveAngle = value;
		}.bindWithoutParam(this), 0, 90, "#2FA1D6");
		// Control: enable/disable workspace axes labels:
		_optionPanel.createBooleanControl("Axes labels:", function(value){
			if (value == true){
				for (var i=0; i<_labels.length; i++){
					_workspaceGeo.add(_labels[i]);
				}
			}
			else {
				for (var i=0; i<_labels.length; i++){
					_workspaceGeo.remove(_labels[i]);
				}
			}
			}.bindWithoutParam(this), "#2FA1D6");
		// Control: enable/disable current force projection axes:
		_optionPanel.createBooleanControl("Force projection axes:", function(value){
				_displayForceAxes = value;
		}.bindWithoutParam(this), "#2FA1D6");
		// Info: JHaptic working context:
		_optionPanel.createVariableMonitor("Working context:", "Context", "#bde2f9");

		
		// register the handlers to rotate the virtual workspace:
		_renderer.domElement.addEventHandler( 'mousedown', onDocumentMouseDown );
		_renderer.domElement.addEventHandler( 'touchstart', onDocumentTouchStart );
		_renderer.domElement.addEventHandler( 'touchmove', onDocumentTouchMove );
	}
	
	var onDocumentMouseDown = (function( event ) {
		if (_containerDiv.style.visibility != 'hidden'){
			event.preventDefault();
			_renderer.domElement.addEventHandler( 'mousemove', onDocumentMouseMove, false );
			_renderer.domElement.addEventHandler( 'mouseup', onDocumentMouseUp, false );
			_renderer.domElement.addEventHandler( 'mouseout', onDocumentMouseOut, false );
			mouseXOnMouseDown = event.clientX - windowHalfX;
			targetRotationOnMouseDown = targetRotation;
		}
	}).bindWithoutParam(this);

	var onDocumentMouseMove = (function( event ) {
		mouseX = event.clientX - windowHalfX;
		//mouseY = event.clientY - viewportHalfY;
		targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.02;
	}).bindWithoutParam(this);

	var onDocumentMouseUp = (function( event ) {
		_renderer.domElement.removeEventHandler( 'mousemove', onDocumentMouseMove, false );
		_renderer.domElement.removeEventHandler( 'mouseup', onDocumentMouseUp, false );
		_renderer.domElement.removeEventHandler( 'mouseout', onDocumentMouseOut, false );
	}).bindWithoutParam(this);

	var onDocumentMouseOut = (function( event ) {
		_renderer.domElement.removeEventHandler( 'mousemove', onDocumentMouseMove, false );
		_renderer.domElement.removeEventHandler( 'mouseup', onDocumentMouseUp, false );
		_renderer.domElement.removeEventHandler( 'mouseout', onDocumentMouseOut, false );
	}).bindWithoutParam(this);

	var onDocumentTouchStart = (function( event ) {
		if ( event.touches.length == 1 ) {
			event.preventDefault();
			mouseXOnMouseDown = event.touches[ 0 ].pageX - windowHalfX;
			targetRotationOnMouseDown = targetRotation;
		}
	}).bindWithoutParam(this);

	var onDocumentTouchMove = (function( event ) {
		if ( event.touches.length == 1 ) {
			event.preventDefault();
			mouseX = event.touches[ 0 ].pageX - windowHalfX;
			targetRotation = targetRotationOnMouseDown + ( mouseX - mouseXOnMouseDown ) * 0.05;
		}
	}).bindWithoutParam(this);
	
	/**
	 * This method updates the 3d scene for a single frame;
	 * @private
	 */
	function draw3dElements(){  
		// if the workspace view has been rotated:
		_plane.rotation.z = _workspaceGeo.rotation.y += ( targetRotation - _workspaceGeo.rotation.y ) * 0.05;
		_plane.rotation.x = (_perspectiveAngle - 90) * Math.PI/180;
		_workspaceGeo.rotation.x = _perspectiveAngle * Math.PI/180;

		// refresh the end-effector position indicator:
		_positionPoint.position.x = _currentPosition.getX();
		_positionPoint.position.y = _currentPosition.getY();
		_positionPoint.position.z = _currentPosition.getZ();
		// and make it blinking:
		var time = new Date();
		var scaleFactor = Math.abs( 2 * Math.sin(1/300 * time) ) + 1;
		_positionSphere.scale = new THREE.Vector3( scaleFactor , scaleFactor, scaleFactor);
		// shift position axes:
		_positionXAxis.position.y = _currentPosition.getY();
		_positionXAxis.position.z = _currentPosition.getZ();
		_positionYAxis.position.x = _currentPosition.getX();
		_positionYAxis.position.z = _currentPosition.getZ();
		_positionZAxis.position.x = _currentPosition.getX();
		_positionZAxis.position.y = _currentPosition.getY();
		// then refresh the force versor indicator:
		var versor = _currentForce.getVersor();
		_forceVersor.geometry.vertices[1].position.x = 20 * versor.getX();
		_forceVersor.geometry.vertices[1].position.y = 20 * versor.getY();
		_forceVersor.geometry.vertices[1].position.z = 20 * versor.getZ();
		_forceVersor.geometry.__dirtyVertices = true;
		// and add the cone arrow:
		var vectorLength = 25; // the lenght of the 3d vector rendered in the virtual scene;
		if ( _currentForce.getMagnitude() != 0 ){
			_positionPoint.add(_forceArrow);
			_forceArrow.position.x = vectorLength * versor.getX();
			_forceArrow.position.y = vectorLength * versor.getY();
			_forceArrow.position.z = vectorLength * versor.getZ();
			// convert from cartesian to spherical coordinates and rotate with the right offsets:
			_forceArrow.rotation.z = -Math.acos( versor.getY() );	// versor's magnitude is 1;
			_forceArrow.rotation.y = Math.atan2( versor.getX(), versor.getZ() ) - 90*Math.PI/180;
			if ( _displayForceAxes == true ){
				// and update force projection axes:
				_positionPoint.remove( _forceAxes );
				_forceAxes = new THREE.Mesh( new THREE.CubeGeometry(versor.getX(),versor.getY(),versor.getZ(),1,1,1), new THREE.MeshBasicMaterial( { color: 0xc70207, wireframe:true, wireframeLinewidth:1, opacity:0.2}));
				_forceAxes.doubleSided = true;
				_forceAxes.overdraw = true;
				_positionPoint.add( _forceAxes );
				_forceAxes.scale = new THREE.Vector3(vectorLength, vectorLength, vectorLength);
				_forceAxes.position = new THREE.Vector3(vectorLength*versor.getX()/2, vectorLength*versor.getY()/2, vectorLength*versor.getZ()/2);
			}
			else {
				_positionPoint.remove( _forceAxes );
			}
		}
		else {
			// the current force vector is (0,0,0):
			_positionPoint.remove(_forceArrow);	
			_positionPoint.remove( _forceAxes );
		}
		if ( _displayViewportBorders == true ){
			// update the webpage viewport geometry:
			_workspaceGeo.remove( _viewportBordersGeo );
			_viewportBordersGeo = new THREE.Mesh( 
					new THREE.CubeGeometry(window.innerWidth*_pixelWidth*_conversionIndex, window.innerHeight*_pixelWidth*_conversionIndex,0,1,1,1),
					new THREE.MeshBasicMaterial( { color: 0x940c4f, wireframe:true, wireframeLinewidth:1, opacity:1}));
			_viewportBordersGeo.overdraw = true;
			// and set the correct position of the viewport in workspace:
			var windowBorder = (window.outerWidth - window.innerWidth)/2;
			var statusBar = 0;
			if (document.getElementById("status-bar"))
				if (document.getElementById("status-bar").boxObject.height)
					statusBar = document.getElementById("status-bar").boxObject.height;
			var xOffset = (window.screenLeft + windowBorder /*+ window.pageXOffset*/);
			var yOffset = (window.screenTop + window.outerHeight - window.innerHeight - windowBorder - statusBar /*+ window.pageYOffset*/);
			_viewportBordersGeo.position.x = ( ( - ( window.screen.width - window.innerWidth ) / 2 ) + xOffset ) * _pixelWidth * _conversionIndex;
			_viewportBordersGeo.position.y = ( ( ( window.screen.height - window.innerHeight ) / 2 ) - yOffset ) * _pixelWidth * _conversionIndex;
			_workspaceGeo.add(_viewportBordersGeo);
		}
		else {
			_workspaceGeo.remove( _viewportBordersGeo );
		}
		// draw!:
		_renderer.render(_scene, _camera);
	}
	
	/**
	 * Refresh the whole canvas, this will be executed for any frame
	 * so it will try to run every 60 seconds;
	 */
	function animate(){
		requestAnimFrame( animate.bind(this) );
		if (_containerDiv.style.visibility != 'hidden'){
			if ((_mainCanvas.clientWidth != _mainCanvas.width) || (_mainCanvas.clientHeight != _mainCanvas.height) || 
					(_previousForce.getMagnitude().toString() != _currentForce.getMagnitude().toString())){
				// updates canvas width and height in case the user has change the size of the browser window:
				if ((_mainCanvas.clientWidth != _mainCanvas.width) || (_mainCanvas.clientHeight != _mainCanvas.height)){
					setSize.call(this, _mainCanvas.clientWidth, _mainCanvas.clientHeight);
					// re-draw all the main canvas, starting from background:
					drawBackground.call(this);
					// and then re-draw the force indicator:
					drawBarLabels.call(this);
					drawForceLevel.call(this);
				}
				else if (_previousForce.getMagnitude().toString() != _currentForce.getMagnitude().toString()){
					// re-draw only force level:
					drawForceLevel.call(this);
				}
				_previousForce.setVector(_currentForce);
			}
			// and then draw the 3d scene:
			draw3dElements.call(this);	
		}
	}
	
	// Creates the main canvas:
	_mainCanvas = document.createElement("canvas");
	_mainCanvas.id = "debugVirtualWorkspaceMainCanvas";
	_containerDiv.appendChild(_mainCanvas);
	// set css style for _mainCanvas object:
	with (_mainCanvas.style){
		position = "absolute";
		top = "0px";
		left = "0px";
		right = "0px";
		bottom = "0px";
		width = "100%";
		height = "100%";
		resize = "none";
		mozBorderRadius = "6px";
		webkitBorderRadius = "6px";
		borderRadius = "6px";
	}
	if (_mainCanvas.getContext) _context = _mainCanvas.getContext('2d');
	
	/******************************************************************/
	/* This is an hack to force GPU hardware acceleration on canvas element in WebKit: */
	_mainCanvas.style.webkitTransform = "translateZ(0)";
	/******************************************************************/
		
	init.call(this);
	animate.call(this);
	
	/* Privileged methods:-----------------------------------------------------------------------------------------------*/
	/**
	 * Update the current force value sent to the haptic device;
	 * @param {Vector} forceValue: referred to the end-effector coordinate system,
	 * 			right-ended coordinates (x-positive: right, y-positive: upper, z-positive: near);
	 * 			[measured in Newton]
	 */
	this.updateForce = function(forceValue){
		_currentForce.setVector(forceValue);
	}
	
	/**
	 * Update the current position value received from the haptic device;
	 * @param {Vector} positionValue: referred to the base coordinate system,
	 * 			right-ended coordinates (x-positive: right, y-positive: upper, z-positive: near),
	 * 			(0,0,0) is the workspace center;
	 * 			[measured in Meter]
	 */
	this.updatePosition = function(positionValue){
		_currentPosition.setVector(positionValue);
		_currentPosition.scale(_conversionIndex);
	}
	
	/**
	 * @param {String} contextValue
	 */
	this.updateContext = function(contextValue){
		if (_currentContext != contextValue){
			_currentContext = String(contextValue);
			_optionPanel.variableMonitor.updateContext(_currentContext);
			if (_currentContext == "3d"){
				_workspaceGeo.remove(_desktopBordersGeo);
				_workspaceGeo.remove(_viewportBordersGeo);
				_optionPanel.removeControl("Viewport borders:");
				_optionPanel.removeControl("Desktop borders:");
			}
			else if (_currentContext == "2d"){
				_optionPanel.createBooleanControl("Desktop borders:", function(value){
						if ( value == true ){			
							_workspaceGeo.add(_desktopBordersGeo);
						}
						else {
							_workspaceGeo.remove(_desktopBordersGeo);
						}
					}.bindWithoutParam(this), "#bde2f9");
			_optionPanel.createBooleanControl("Viewport borders:", function(value){
						_displayViewportBorders = value;
				}.bindWithoutParam(this), "#bde2f9");
			}
		}
	}
	
}