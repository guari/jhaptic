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
 * Calculates the sine of a Vector.
 * @param {Vector};
 * @returns {Vector} result;
 * @extends Math (! it's static, math functions are only functions, not methods of an object, so no prototype);
 * @author Andrea Guarinoni
 */
Math.sinVector = function(vector){
	var result = new jhaptic.Vector(0,0,0);
	// Check if the parameter 'vector' is a Vector object:
	if (vector instanceof jhaptic.Vector){
		result.set(Math.sin(vector.getX()), Math.sin(vector.getY()), Math.sin(vector.getZ()));
	}
	else throw new TypeError('Math.sinVector(): The parameter passed is not a Vector object.')
	return result;
}
