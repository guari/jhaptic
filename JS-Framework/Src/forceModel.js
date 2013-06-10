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
* Provides a generic force model object used as structure to calculate force values;
* @param {Function} func: the function needed as model to compute force values,
* 						  the function passed must return a Vector
* 					      (see predefined force models examples - Spring, Damper,...);
* @author Andrea Guarinoni
*/
jhaptic.ForceModel = function(func) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _func;
	
	// Performs some consistency checks on the passed value:
	if (func === undefined) {
		throw new ReferenceError('{ForceModel} constructor is called without passing the expected parameter.');
	}
	else if (func instanceof Function){
		_func = func;
	}
	else {
		throw new TypeError('The parameter passed to {ForceModel} constructor does not reference to a function.');
	}
	
	//	Methods that have direct access to private variables or methods:
	/*Privileged method:----------------------------------------------------------------------------------------*/
	/**
	 * Calculates the values for the force vector using as model the given function;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 						   (it is needed to obtain the parameter/s dependent on the current state of the device);
	 * @returns {Vector} force: Force calculated using the current model;
	 */
	this.getForce = function(device){
		var force = new jhaptic.Vector(0,0,0);
		// Ensures that the returned value of the function _func is a Vector:
		force.setVector(_func(device));
		return force;
	}
}
/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Used to compose a new force model by combining multiple force templates.
 * This method sum two force model;
 * @param {ForceModel} forceModel;
 * @returns {ForceModel} sum = this + forceModel;
 */
jhaptic.ForceModel.prototype.plus = function(forceModel){
	// return a new ForceModel object with a calculation function
	// that sums the two force models, the function has to be called
	// using 'this' scope and receives 'device' parameter when it is called:
	return new jhaptic.ForceModel(function(device){
		// sum the vector objects returned by calling getForce method:
		var force = this.getForce(device).plus(forceModel.getForce(device));
		return force;
		}.bindWithoutParam(this));
}

/**
 * Used to compose a new force model by combining multiple force templates.
 * This method subtracts two force model;
 * @param {ForceModel} forceModel;
 * @returns {ForceModel} subtraction = this - forceModel;
 */
jhaptic.ForceModel.prototype.minus = function(forceModel){
	// return a new ForceModel object with a calculation function
	// that subtracts the two force models, the function has to be called
	// using 'this' scope and receives 'device' parameter when it is called:
	return new jhaptic.ForceModel(function(device){
		// subtract the vector objects returned by calling getForce method:
		var force = this.getForce(device).minus(forceModel.getForce(device));
		return force;
		}.bindWithoutParam(this));
}

/**
 * Used to compose a new force model by combining multiple force templates.
 * This method multiplies two force model;
 * @param {ForceModel} forceModel;
 * @returns {ForceModel} moltiplication = this * forceModel;
 */
jhaptic.ForceModel.prototype.amplifiedWith = function(forceModel){
	// return a new ForceModel object with a calculation function
	// that multiplies the two force models, the function has to be called
	// using 'this' scope and receives 'device' parameter when it is called:
	return new jhaptic.ForceModel(function(device){
		// multiply the vector objects returned by calling getForce method:
		var force = this.getForce(device).multipliedBy(forceModel.getForce(device));
		return force;
		}.bindWithoutParam(this));
}

/**
 * Overwrites toString() method for ForceModel object;
 * @returns {String};
 */
jhaptic.ForceModel.prototype.toString = function(){
	return "<b>ForceModel </b><i>(custom parameters)</i>";
}
