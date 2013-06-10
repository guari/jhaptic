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
 * Returns the current array converted in a Vector object, extends default Array object.
 * @returns {Vector} if 'this' is a valid array, otherwise returns null;
 * @extends Array;
 * @throws ArrayWrongLengthException;
 * @author Andrea Guarinoni
 */
Array.prototype.toVector = function(){
	try{
		if (this.length != 3) throw "ArrayWrongLengthException";
	} catch(error){
		if (error == "ArrayWrongLengthException") {
			alert(error+": array "+this+"is not a valid Vector");
			return null;
		}
	}
	return new jhaptic.Vector(this[0],this[1],this[2]);
}

/**
 * Remove empty elements (array[i] == undefined) from the array 'this';
 */
Array.prototype.removeEmptyElem = function() {
	for (var i=this.length; i>=0; i--) {
		if (this[i] == undefined)  {
			this.splice(i, 1);
		}
	}
}

/**
 * Remove an element from the array 'this';
 * @param {Object} object: item that we want to delete;
 * @author Andrea Guarinoni
 */
Array.prototype.removeFromArray = function(object) {
	while((index= this.indexOf(object)) != -1){
        this.splice(index, 1);
    }
}

/**
 * Finds max value into an array;
 * @returns {Object}max value;
 */
Array.prototype.maxValue = function(){
	return Math.max.apply(Math, this);
	// NB: probably using 'Math' as context for the apply method is not fundamental,
	// using as context 'null' works anyway because the Math methods are static and
	// have no particular context (ie: this='window').
}

/**
 * Finds min value into an array;
 * @returns {Object}min value;
 */
Array.prototype.minValue = function(){
	return Math.min.apply(Math, this);
	// NB: probably using 'Math' as context for the apply method is not fundamental,
	// using as context 'null' works anyway because the Math methods are static and
	// have no particular context (ie: this='window').
}

/**
 * (this is for IE 8 and older versions, it is the original implementation of Array.indexOf() method);
 * @param {Object} searchElement
 * @returns {number}
 */
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(searchElement /*, fromIndex */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
      return -1;

    var n = 0;
    if (arguments.length > 0)
    {
      n = Number(arguments[1]);
      if (n !== n) // shortcut for verifying if it's NaN
        n = 0;
      else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    if (n >= len)
      return -1;

    var k = n >= 0
          ? n
          : Math.max(len - Math.abs(n), 0);

    for (; k < len; k++)
    {
      if (k in t && t[k] === searchElement)
        return k;
    }
    return -1;
  };
}