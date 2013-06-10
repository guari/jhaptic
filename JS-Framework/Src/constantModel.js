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
 * Defines a Constant force model object F=const.
 * @param {Vector} k: vector containing the constant values for the 3 axis [measured in Newton];
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.ConstantModel = function(k) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _const = new jhaptic.Vector(0,0,0);
	
	//Methods that have direct access to private variables or methods:
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @returns {Vector} force;
	 */
	function model() {
		// force F=[constX,constY,constZ]:
		return _const;
	}
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	/**
	 * Gets the value of the constant;
	 * @return {Vector};
	 */
	this.getConstant = function(){
		return _const;
	}
	
	/**
	 * Sets the value of the constant;
	 * @param {Vector} value;
	 */
	this.setConstant = function(value){
		if (value instanceof jhaptic.Vector){
			_const.setVector(value);
		} else throw 'WrongConstTypeException';
	}
	
	// Sets the value passed to the constructor ensuring that is a valid object;
	this.setConstant(k);
	jhaptic.ForceModel.call(this, model);
}

jhaptic.ConstantModel.prototype = new jhaptic.ForceModel(function(){});
jhaptic.ConstantModel.prototype.constructor = jhaptic.ConstantModel;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for ConstantModel object;
 * @returns {String} containing ConstantModel parameters;
 */
jhaptic.ConstantModel.prototype.toString = function(){
	return "<b>ConstantModel </b><i>(constant: ["+this.getConstant().toString()+"] N)</i>";
}
