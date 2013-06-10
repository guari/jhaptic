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
 * Defines a Gravity force model object F=m*g (g: gravitational acceleration constant),
 * it could be used to simulate a different weight of the end-effector on 3d haptic device
 * with an arm mass self balanced.
 * @param {Number} mass: costante che identifica una massa virtuale (m);
 * @extends ConstantModel;
 * @author Andrea Guarinoni
 */
jhaptic.Gravity = function(mass) {
	/**
	 * @constructor:
	 */
	var _mass;
	var _g = new jhaptic.Vector(0,9.8,0);
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	/**
	 * Gets the value of the mass;
	 * @return {Number};
	 */
	this.getMass = function(){
		return _mass;
	}
	
	/**
	 * Sets the value of the mass;
	 * @param {Number} value;
	 */
	this.setMass = function(value){
		if (isNaN(value))	 throw 'WrongMassTypeException'; 
		else _mass = new Number(value);
	}
	
	// Sets the value passed to the constructor ensuring that is a valid object;
	this.setMass(mass);
	jhaptic.ConstantModel.call(this, _g.multipliedByScalar(_mass));
}
jhaptic.Gravity.prototype = new jhaptic.ConstantModel();
jhaptic.Gravity.prototype.constructor = jhaptic.Gravity;

/**
 * Overwrites toString() method for Gravity object;
 * @returns {String} containing Gravity parameters;
 */
jhaptic.Gravity.prototype.toString = function(){
	return "<b>Gravity </b><i>(mass constant: "+this.getMass().toString()+")</i>";
}
