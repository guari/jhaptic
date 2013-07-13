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
 * Defines a Mass force model object F=m*a.
 * @param {Number} mass: constant to define a virtual mass (m) [measured in Kilograms];
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.Mass = function(mass) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _mass;
	
	//Methods that have direct access to private variables or methods:
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 						   (it is needed to obtain the current acceleration of the pointer);
	 * @returns {Vector} force calculated using the current parameters;
	 */
	function model(device) {
		var acceleration = new jhaptic.Vector(0,0,0);
		var force = new jhaptic.Vector(0,0,0);
		// gets the current acceleration and store it in 'acceleration' Vector:
		acceleration.setVector(device.getAcceleration());
		// calculates force F=m*[accX,accY,accZ]:
		force.setVector(acceleration.multipliedByScalar(_mass));
		return force;
	}
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	/**
	 * Gets the value of the mass;
	 */
	this.getMassConstant = function(){
		return _mass;
	}
	
	/**
	 * Sets the value of the mass;
	 * @param {Number} value;
	 */
	this.setMassConstant = function(value){
		if (!isNaN(new Number(value))){
			_mass = new Number(value);
		} else throw 'WrongMassConstantTypeException';
	}
	
	// Sets the value passed to the constructor ensuring that is a valid object;
	this.setMassConstant(mass);
	jhaptic.ForceModel.call(this, model);
}

jhaptic.Mass.prototype = new jhaptic.ForceModel(function(){});
jhaptic.Mass.prototype.constructor = jhaptic.Mass;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Mass object;
 * @returns {String} containing Mass parameters;
 */
jhaptic.Mass.prototype.toString = function(){
	return "<b>Mass </b><i>(mass constant: ["+this.getMassConstant().toString()+"] kg)</i>";
}
