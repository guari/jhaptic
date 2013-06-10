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

/***********************************************************************/
// Main JHaptic Library object:
var jhaptic = {};
/***********************************************************************/

/**
 * Function extension for binding the current scope with parameter passing. 
 * @param {Object} scope: the scope to bind the function that is extended;
 * @param (optional) arguments;
 * @returns {Function} 'this' with the scope 'scope';
 * @extends {Function};
 * @author Andrea Guarinoni;
 */
Function.prototype.bind = function(scope) {
    var _function = this;
    var _args = [];
    var i = 0;
    for (i; i<arguments.length-1; i++){ _args[i]=arguments[i+1]; }
    return function() {
        // returns the same function on which is called but with 'this' equal to the first parameter
        // and the remaining specified parameters as parameters of the function returned
	    return _function.apply(scope, _args);
	    // (eg. myFunction.bind(newScope, param1, param2, ...) -> returns an anonymous function
		// which in turns returns the function myFunction(param1, param2,....) with set this=newScope;
        // NB: the function returned is not the same object of the initial, it's another identical)
	}
}

/**
 * This version of bind method is useful when there is no need to pass parameter
 * when the function 'this' is passed (calling the bind() method) but we need to receive 
 * some arguments when the function returned is called (typically using it as event handlers);
 * @param {Object} scope: the scope to bind the function that is extended;
 * @returns {Function}'this' with the scope 'scope';
 * @extends {Function};
 * @author Andrea Guarinoni
 */
Function.prototype.bindWithoutParam = function(scope){
	var _function = this;
	return function(){
		return _function.apply(scope, arguments);
	}
}

/**
 * This version of bind method is useful for binding the current scope with parameter passing
 *  including as first parameter passed the object on which the event has been fired
 *  (when using it for setting event handlers);
 * @param {Object} scope: the scope to bind the function that is extended;
 * @param (optional) arguments;
 * @returns {Function}'this' with the scope 'scope';
 * @extends {Function};
 * @author Andrea Guarinoni
 */
Function.prototype.bindAsEventListener = function(scope){
	var _function =  this;
	var _scope = scope;
	var _args = arguments;
	return function(event){
		// Due to the different way of passing events in different browsers:
		if (!event) event = window.event;
	    var _src = (typeof event.currentTarget != 'undefined') ? event.currentTarget : event.srcElement;
		_args[0] = _src;
		return _function.apply(_scope, _args);
		// (eg. myFunction.bindAsEventListener(newScope, param1, param2, ...) -> returns an anonymous function
        // which in turns returns the function myFunction(targetObject, param1, param2,....) with set this=newScope
		// and as targetObject a reference to the object on which occurred the event to handle;
	}
}
