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
 * Defines a Damper force model object F=-k*v.
 * @param {Vector} viscousConstant: (k) [measured in (Newton*Second)/Meter];
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.Damper = function(viscousConstant) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _viscousConstant = new jhaptic.Vector(0,0,0);
	
	//Methods that have direct access to private variables or methods:
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 					       (it is needed to obtain the current speed of the pointer);
	 * @returns {Vector} force calculated using the current parameters;
	 */
	 function model(device) {
		 var speed = new jhaptic.Vector(0,0,0);
		var force = new jhaptic.Vector(0,0,0);
		// gets the current speed and store it in 'speed' Vector:
		speed.setVector(device.getSpeed());
		// calculates force F=-[kx,ky,kz]*[velX,velY,velZ]:
		force.setVector((_viscousConstant.multipliedBy(speed)).getInverse());
		return force;
	}
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	 /**
		 * Gets the value of the viscous constant;
		 */
		this.getViscousConstant = function(){
			return _viscousConstant;
		}
		
		/**
		 * Sets the value of the viscous constant;
		 * @param {Vector} value;
		 */
		this.setViscousConstant = function(value){
			if (value instanceof jhaptic.Vector){
				_viscousConstant.setVector(value);
			} else throw 'WrongViscousConstantTypeException';
		}
		
		// Sets the value passed to the constructor ensuring that is a valid object;
		this.setViscousConstant(viscousConstant);
		jhaptic.ForceModel.call(this, model);
}

jhaptic.Damper.prototype = new jhaptic.ForceModel(function(){});
jhaptic.Damper.prototype.constructor = jhaptic.Damper;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Damper object;
 * @returns {String} containing Damper parameters;
 */
jhaptic.Damper.prototype.toString = function(){
	return "<b>Damper </b><i>(Viscous constant: ["+this.getViscousConstant().toString()+"] N*s/m)</i>";
}
