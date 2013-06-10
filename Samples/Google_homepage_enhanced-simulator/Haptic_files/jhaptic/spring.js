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
 * Defines a Spring force model object F=-k*(point-POI).
 * @param {Vector} elasticConstant: (k) [measured in Newton/Meter];
 * @param {Vector}POI: point of interest coordinates (POI) [measured in Pixel];
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.Spring = function(elasticConstant,POI) {
	/**
	 * @constructor:
	 */	
	/*Private variables:-------------------------------------------------------------------------------------------*/
	var _elasticConstant = new jhaptic.Vector(0,0,0);
	var _POI = new jhaptic.Vector(0,0,0);
	
	//	Methods that have direct access to private variables or methods:
	/*Private method:-------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 													(it is needed to obtain the current position of the pointer);
	 * @returns {Vector} force: Force calculated using the current parameters;
	 */
	function model(device) {
		var position = new jhaptic.Vector(0,0,0);
		var force = new jhaptic.Vector(0,0,0);
		// gets the current device position and store it in 'position' Vector:
		position.setVector(device.getPosition());
		// calculates force F=-[kx,ky,kz]*([posX,posY,posZ]-[POIx,POIy,POIz]):
		// (the values of the vector _POI is converted from Pixel, that identifies the position
		// of the Point Of Interest on the page, to Meter, that identifies the position of the
		// Point Of Interest into the physical workspace)
		force.setVector((_elasticConstant.multipliedBy(position.minus(_POI.multipliedByScalar(device.getPixelWidth())))).getInverse());
		return force;
	}
	
	/*Privileged methods:----------------------------------------------------------------------------------------*/
	/**
	 * Gets the value of the elastic constant;
	 */
	this.getElasticConstant = function(){
		return _elasticConstant;
	}
	
	/**
	 * Sets the value of the elastic constant;
	 * @param {Vector} value;
	 */
	this.setElasticConstant = function(value){
		if (value instanceof jhaptic.Vector){
			_elasticConstant.setVector(value);
		} else throw 'WrongElasticConstantTypeException';
	}
	
	/**
	 * Gets the value of the point of interest;
	 */
	this.getPOI = function(){
		return _POI;
	}
	
	/**
	 * Sets the value of the point of interest;
	 * @param {Vector} value;
	 */
	this.setPOI = function(value){
		if (value instanceof jhaptic.Vector){
			_POI.setVector(value);
		} else throw 'WrongPOITypeException';
	}
	
	// Sets the values passed to the constructor ensuring that are valid objects;
	this.setElasticConstant(elasticConstant);
	this.setPOI(POI);
	jhaptic.ForceModel.call(this, model);
}

jhaptic.Spring.prototype = new jhaptic.ForceModel(function(){});
jhaptic.Spring.prototype.constructor = jhaptic.Spring;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Spring object;
 * @returns {String} containing Spring parameters;
 */
jhaptic.Spring.prototype.toString = function(){
	return "<b>Spring </b><i>(Elastic constant: ["+this.getElasticConstant().toString()+"] N/m, POI: ["+this.getPOI().toString()+"] px)</i>";
}
