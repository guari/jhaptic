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
 * Provides a messageBox that can display log message formatted with html and supports the input
 * and execution of javascript source code;
 * @param {HTMLDivElement} containerDiv;
 * @author Andrea Guarinoni
 */
jhaptic.MessageBox = function(containerDiv){
	// the div used as container for the message box element:
	var _containerDiv;
	
	// Verifies that the element passed is a DIV:
	if (containerDiv.nodeName=="DIV"){
		_containerDiv = containerDiv;
	}
	else throw "ElementIsNotADivException";
	
	with (_containerDiv.style){
		width = "100%";
		height = "100%";
		background = "#ffffff";
		overflow = "auto";
		//border = "1px solid #1A1A1A";
		borderRadius = "6px 6px 6px 6px";
		mozBorderRadius = "6px 6px 6px 6px";
		webkitBorderRadius = "6px 6px 6px 6px";
	}
	
	/**
	 * @param {String} id: (optional);
	 * @param {String} bgColor: (optional);
	 * @returns {HTMLElement}
	 * @private
	 */
	function createNewLineBlock(id, bgColor){
		var liElementExternal = document.createElement("li");
		if (id){
			liElementExternal.id = id;
		}		
		_containerDiv.appendChild(liElementExternal);
		with (liElementExternal.style){
			color = "#000000";
			if (bgColor){ backgroundColor = bgColor; }
			borderBottom = "1px solid #eeeeee";
			overflow = "hidden";
			width = "100%";
			float = "right";
			cursor = "default";
			padding = "0px 0px 0px 0px";
			margin = "0px 0px 0px 0px";
			listStyle = "none";
			// this is for the fading effect:
			opacity = "0";
		}
		var liElementInternal = document.createElement("li");
		with (liElementInternal.style){
			overflow = "hidden";
			listStyle = "none";
			margin = "0px 3px 0px 3px";
			padding = "1px 0px 1px 0px";
		}		
		liElementExternal.appendChild(liElementInternal);
		// add a fading effect:
		liElementInternal.addEventHandler('DOMappend', function(e){
			var target = e.currentTarget || e.srcElement;
			with (target.parentNode.style){
				opacity = "1";
				webkitTransition = "opacity 1.0s linear";
				mozTransition = "opacity 1.0s linear";
				oTransition = "opacity 1.0s linear";
				msTransition = "opacity 1.0s linear";
				transition = "opacity 1.0s linear";
			}
		});
		return liElementInternal;
	}
	
	/**
	 * Dynamically adjusts the height of the textarea used to input the js code
	 * according to the size of the text currently entered;
	 * @param {Event} event;
	 * @private
	 */
	var adjustTextAreaSize = function(event){
		var target = event.target || event.srcElement;
		// when a key is entered into the text input box,
		// resize the textarea to fit the height of the input:
		// in order to do this, we will use a simple hack:
		// insert the current text entered into a DIV element
		// with the same width, font, padding and margin of the textarea:
		if (target.value != "" ){
			var newDiv = document.createElement("div");
			var currentText = document.createTextNode(target.value);
			newDiv.appendChild(currentText);
			// then attach it to the DOM:
			newDiv.style.width = target.clientWidth + "px";
			with (newDiv.style){
				visibility = "hidden";
				font = "9pt Consolas";
				height = "auto";
				overflow = "auto";
				border = "0px solid";
				padding = "0px 0px 0px 0px";
				margin = "0px 0px 0px 0px";
			}
			document.body.appendChild(newDiv);
			// obtain the offset of the div, resize the textarea, then scrolldown the messageBox:
			target.style.height = newDiv.clientHeight + "px";
			// and finally remove it from the DOM:
		document.body.removeChild(newDiv);
		}
	}
	
	/**
	 * Inject the code entered in the textarea when the 'enter' key is pressed;
	 * @param {Event} event;
	 * @private
	 */
	var injectCode = function(event){
		var key = event.keyCode || event.which;
		if (key == 13){	// 'ENTER' key;
			// save the current length of the list containing log messages:
			var oldMessageListLength = _containerDiv.childNodes.length-1;
			// build the output message by executing the code entered:
			var target = event.target || event.srcElement;
			var msgInput = "<span style='color:#737f8a; font:9pt Consolas; font-weight:bold; listStyle:none; margin:0px 0px 0px 0px; padding:0px 3px 0px 3px'>></span>" +
					"<span style='color:#1490fa'>" + target.value + "</span>";
			var result = eval.call(window, target.value);
			var msgOutput = "<span style='color:#92b4d3; font:9pt Consolas; font-weight:bold; listStyle:none; margin:0px 0px 0px 0px; padding:0px 3px 0px 3px'>&#xab</span>";
			if ((result instanceof Object) && (result != null)){
				msgOutput += "<span style='color:#8ea6ba'><b>" + result.constructor.name + "</b>: " + result + "</span>";
			}
			else {
				msgOutput += "<span style='color:#8ea6ba'>" + result + "</span>";
			}
			// save the new log message added, in case the code executed has produced some additional log output:
			var messageAddedList = new Array();			
			for (var i = oldMessageListLength; i < _containerDiv.childNodes.length-1; i++){
				messageAddedList.push(_containerDiv.childNodes[i]);
			}
			// remove from the log message list the additional log output:
			for (var i = _containerDiv.childNodes.length-2; i >= oldMessageListLength; i--){
				_containerDiv.removeChild(_containerDiv.childNodes[i]);
			}
			// empty the code input box:
			target.value = "";
			// and display the result of the command entered:
			if (messageAddedList.length == 0){
				// no additional output:
				this.addMessage(msgInput+"<br/>"+msgOutput, "#eaf4fc");
			}
			else{
				this.addMessage(msgInput, "#eaf4fc");
				// finally restore the correct chronology by inserting the additional log message after the code executed box:
				for (var i = 0; i < messageAddedList.length; i++){
					_containerDiv.insertBefore(messageAddedList[i], _containerDiv.lastChild);	
				}
				this.addMessage(msgOutput, "#eaf4fc");
			}
			// after adding the message to the messageBox, scroll down the div:
			_containerDiv.scrollTop = _containerDiv.scrollHeight;
		}
	}.bindWithoutParam(this);
	
	/**
	 * Create the code input line into the messageBox;
	 * @private
	 */
	function addCodeInput(){
		var liElement = createNewLineBlock.call(this, "debugCodeInput");
		var spanElement = document.createElement("span");
		with (spanElement.style){
			color = "#36a5fa";
			font = "9pt Consolas";
			fontWeight = "bold";
			listStyle = "none";
			margin = "0px 0px 0px 0px";
			padding = "0px 3px 0px 3px";
		}
		spanElement.appendChild(document.createTextNode(">"));
		liElement.appendChild(spanElement);
		var textarea = document.createElement("textarea");
		textarea.rows = "1";
		with (textarea.style){
			position = "absolute";
			right = "4px";
			left = "20px";
			color = "#015194";
			font = "9pt Consolas";
			resize = "none";
			width = "auto";
			height = "auto";
			border = "0px solid";
			outline = "none";
			padding = "0px 0px 15px 0px";
			margin = "0px 0px 0px 0px";
			borderStyle = "none"; 
		    borderColor = "transparent"; 
		    overflow = "auto";   
		}
		liElement.appendChild(textarea);
		textarea.addEventHandler("keypress", injectCode);
		textarea.addEventHandler("change", adjustTextAreaSize);
		textarea.addEventHandler("keydown", adjustTextAreaSize);
		textarea.addEventHandler("keyup", adjustTextAreaSize);
		textarea.addEventHandler("resize", adjustTextAreaSize);
		
		// when the message is ready dispach the event that fade out the line:
		liElement.fireEvent('DOMappend');
	}
	
	/**
	 * Add a new message to the messageBox;
	 * @param {String} msg: the message that has to be displayed
	 * 					(can be a simple text or a text formatted in html);
	 * @param {String} bgColor: (optional) background color of the message;
	 */
	this.addMessage = function(msg, bgColor){
		// save code input box:
		var codeInputBox = document.getElementById("debugCodeInput");
		// remove it from message box:
		_containerDiv.removeChild(codeInputBox);
		var liElement = createNewLineBlock.call(this, undefined, bgColor);
		liElement.innerHTML = msg;		
		// restore code input box:
		_containerDiv.appendChild(codeInputBox);
		// after adding the message to the messageBox, scroll down the div:
		_containerDiv.scrollTop = _containerDiv.scrollHeight;
		
		// when the message is ready dispach the event that fade out the line:
		liElement.fireEvent('DOMappend');
	}
	
	/**
	 * Add a new inspector to the messageBox;
	 * @param {Object} arg: the object to inspect;
	 */
	this.addInspector = function(arg){
		// 'targetList' is the list which contains the representation of the current object
		// to inspect (we can have more then one inspector into the message box),
		// and 'obj' is the reference to the object that we need to discover, one level of
		// depth at a time:
		var inspect = function(targetList, obj){
			// inner function:
			var addHoverEffect = function(){
				divElement.addEventHandler('mouseover', function(e){
					var target = e.currentTarget || e.srcElement;
					with (target.style){
						webkitTransition = "all 0.4s ease";
						mozTransition = "all 0.4s ease";
						oTransition = "all 0.4s ease";
						msTransition = "all 0.4s ease";
						transition = "all 0.4s ease";
						backgroundColor = "#ffffff";
						webkitBoxShadow = "5px 0px 15px rgba(236, 1, 73, 0.3)";
						mozBoxShadow = "5px 0px 15px rgba(236, 1, 73, 0.3)";
						boxShadow = "5px 0px 15px rgba(236, 1, 73, 0.3)";
					}
				});
				divElement.addEventHandler('mouseout', function(e){
					var target = e.currentTarget || e.srcElement;
					with (target.style){
					webkitTransition = "all 0.4s ease";
					mozTransition = "all 0.4s ease";
					oTransition = "all 0.4s ease";
					msTransition = "all 0.4s ease";
					transition = "all 0.4s ease";
					backgroundColor = "";
					webkitBoxShadow = "";
					mozBoxShadow = "";
					boxShadow = "";
					}
				});
			}
			// let's start exploration:
			if (targetList == undefined){
				// we are in the root node, so build and append the first node:
				var ulElement = document.createElement('ul');
				with(ulElement.style) {
					color = "#444344";
					listStyle = "none";
				}
				var liElement = document.createElement('li');
				var divElement = document.createElement('div');
				liElement.appendChild(divElement);
				divElement.listIsOpen = false;
				var type = (obj)? (obj.constructor ? (obj.constructor.name != "" ? obj.constructor.name : typeof(obj)) : typeof(obj)) : typeof(obj);
				divElement.innerHTML = "<span style = 'font-style:normal; font-weight:bold; color:#ee0160'>" + type + "</span>";
				ulElement.appendChild(liElement);
				// then append it to the message box:
				var codeInputBox = document.getElementById("debugCodeInput");
				_containerDiv.removeChild(codeInputBox);
				var containerLiElement = createNewLineBlock.call(this, undefined, "#fcf2f6");
				containerLiElement.appendChild(ulElement);
				_containerDiv.appendChild(codeInputBox);
				_containerDiv.scrollTop = _containerDiv.scrollHeight;
				// finally the listener to 'explore' the node:
				divElement.addEventHandler('click', inspect.bindAsEventListener(this, obj));
				divElement.innerHTML = "<span style = 'padding: 0 5px 0 0; color:#444344'>&#x25ba</span>" + divElement.innerHTML; // right-arrow
				divElement.firstChild.style.marginLeft = (-divElement.firstChild.offsetWidth) + "px";
				// add some hover effects:
				addHoverEffect.call(this);
				// when the message is ready dispach the event that fade out the line:
				liElement.fireEvent('DOMappend');
			}
			else{
				if (targetList.listIsOpen == false){
					// explore and show the next level of properties for the current object:
					targetList.listIsOpen = true;
					targetList.firstChild.innerHTML = "&#x25bc"; // down-arrow
					var ulElement = document.createElement('ul');
					with(ulElement.style) {
						color = "#444344";
						listStyle = "none";
					}				
					targetList.parentNode.appendChild(ulElement);
					for (var property in obj) {
						if (obj.hasOwnProperty(property)){
							// for each child node / property build and display an entry:
							var liElement = document.createElement('li');
							var divElement = document.createElement('div');
							liElement.appendChild(divElement);
							divElement.listIsOpen = false;
							var type = (obj[property])? (obj[property].constructor ? obj[property].constructor.name : typeof(obj[property])) : typeof(obj[property]);
							divElement.innerHTML = "<span style = 'font-style:normal; font-weight:bold; color:#ee0160'>" + type + "</span>" +
									"<span style = 'font-style:normal; font-weight:normal; color:#b5003c'> " +
									property + "</span>: " + (obj[property] === undefined ? "<span style = 'font-style:italic; font-weight:bold; color:#6f0037'>undefined</span>"
											: (obj[property] == null ? "<span style = 'font-style:italic; font-weight:bold; color:#6f0037'>null</span>"
													: "<span style = 'font-style:italic; font-weight:normal; color:#687880'>" + obj[property] + "</span>"));
							// but obj[property] can contain a string formatted in html and we don't want that it will be appended to the DOM:
							//divElement.innerText += obj[property];
							//divElement.innerHTML += "</span>";
							ulElement.appendChild(liElement);
							if ((obj[property] instanceof Object) && (obj[property] != null)){
								// if the node is 'explorable' then enable the listener to do it:
								divElement.innerHTML = "<span style = 'padding: 0 5px 0 0; color:#444344'>&#x25ba</span>" + divElement.innerHTML; // right-arrow
								divElement.firstChild.style.marginLeft = (-divElement.firstChild.offsetWidth) + "px";
								divElement.addEventHandler('click', inspect.bindAsEventListener(this, obj[property]));
								// add some hover effects:
								addHoverEffect.call(this);
							}
						}
					}
					if (obj instanceof Object){
						// add the reference to its prototype:
						var liElement = document.createElement('li');
						var divElement = document.createElement('div');
						liElement.appendChild(divElement);
						divElement.listIsOpen = false;
						divElement.innerHTML = "<span style = 'font-style:normal; font-weight:normal; color:#d38293'>__proto__: </span>"+
							"<span style = 'font-style:italic; font-weight:normal; color:#687880'>" + obj.__proto__ + "</span>";
						ulElement.appendChild(liElement);
						divElement.innerHTML = "<span style = 'padding: 0 5px 0 0; color:#444344'>&#x25ba</span>" + divElement.innerHTML; // right-arrow
						divElement.firstChild.style.marginLeft = (-divElement.firstChild.offsetWidth) + "px";
						divElement.addEventHandler('click', inspect.bindAsEventListener(this, obj.__proto__));
						// add some hover effects:
						addHoverEffect.call(this);
					}
					else{
						if (typeof(obj) == 'object'){
							// add the reference to the other non enumerable properties:
							var noEnumProp = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty',
						                   'isPrototypeOf', 'propertyIsEnumerable', 'constructor'];
							for (var i=0; i<noEnumProp.length; i++){
								var liElement = document.createElement('li');
								var divElement = document.createElement('div');
								liElement.appendChild(divElement);
								divElement.listIsOpen = false;
								var value = obj[noEnumProp[i]];
								divElement.innerHTML = "<span style = 'font-style:normal; font-weight:normal; color:#d38293'>"+noEnumProp[i]+": </span>"+
									"<span style = 'font-style:italic; font-weight:normal; color:#687880'>" + (value ? value : 'undefined') + "</span>";
								ulElement.appendChild(liElement);
								if (value instanceof Object){
									divElement.innerHTML = "<span style = 'padding: 0 5px 0 0; color:#444344'>&#x25ba</span>" + divElement.innerHTML; // right-arrow
									divElement.firstChild.style.marginLeft = (-divElement.firstChild.offsetWidth) + "px";
									divElement.addEventHandler('click', inspect.bindAsEventListener(this, value));
									// add some hover effects:
									addHoverEffect.call(this);
								}
							}
						}
					}
				}
				else {
					// remove the 'ul' element with all the childNodes:
					targetList.parentNode.removeChild(targetList.parentNode.lastChild);
					targetList.listIsOpen = false;
					targetList.firstChild.innerHTML = "&#x25ba"; // right-arrow
				}
			}
		}
		inspect.call(this, undefined, arg);
	}
	
	addCodeInput.call(this);
	
}