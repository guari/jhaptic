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
 * Defines a Null force model object F=0, this model can be used in conjunction with other force models
 * to compose patterns of effects.
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.NullModel = function() {
	/**
	 * @constructor:
	 */
	
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @returns {Vector} null force;
	 */
	function model() {
		var force = new jhaptic.Vector(0,0,0);
		return force;
	}

	jhaptic.ForceModel.call(this, model);
}

jhaptic.NullModel.prototype = new jhaptic.ForceModel(function(){});
jhaptic.NullModel.prototype.constructor = jhaptic.NullModel;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for NullModel object;
 * @returns {String};
 */
jhaptic.NullModel.prototype.toString = function(){
	return "<b>NullModel </b><i>()</i>";
}
