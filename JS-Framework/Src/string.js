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
 * Returns the current string converted into an Array object, extends default String object.
 * @returns {Array} result: Array containing the values that are separated with a comma in the string 'this';
 * @extends {String};
 * @throws ArrayWrongLengthException, ArrayInconsistentContentException;
 * @author Andrea Guarinoni
 */
String.prototype.toArray = function(){
		try{
			var result = this.split(",");
			for (var i; i < result.length; i++){
				if (!(result[i] instanceof Number) && typeof result[i] != "number"){
					throw "ArrayInconsistentContentException";
				}
			}
			if (result.length != 3){ 
				throw "ArrayWrongLengthException";
			}
		} catch(error){
			if (error == "ArrayWrongLengthException") {
				alert(error+": Array ["+this+"] is not a valid Vector");
			}
			if (error == "ArrayInconsistentContentException") {
				alert(error+": Content type of the array ["+this+"] aren't all numbers");
			}
		}
		return  result;
}

/**
 * Returns the current string converted into a Vector object, extends default String object.
 * @returns {Vector} result: Vector containing the values that are separated with a comma in the string 'this';
 * @extends {String};
 * @throws VectorWrongLengthException, VectorInconsistentContentException;
 * @author Andrea Guarinoni
 */
String.prototype.toVector = function(){
		var result = this.toArray().toVector();
		return  result;
}

/**
 * Converts the first letter of the words in the string to upper case;
 * @returns {String};
 * @extends {String};
 */
String.prototype.capitaliseFirst = function() {
    var str = this.toLowerCase();
    var words = str.split(' ');
    for ( var i = 0; i < words.length; i++ )
      words[i] = words[i].substring(0,1).toUpperCase() + words[i].substring(1);
    return ( words.join(' ') );
}