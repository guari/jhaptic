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
 * Defines a Magnet force model object F=-k/(point-POI)^grad.
 * @param {Vector} maxAttraction: maximum force attraction (k) [measured in Newton*Pixel];
 * @param {Vector} POI: coordinates of the point of interest (POI) [measured in Pixel];
 * @param {Vector} gradient: 0<=grad<=1, grad->0: constant attractive force, grad->1: strong increase of the attractive force (grad) [adimensional];
 * @param {Vector} hapticallyActiveMargins: defines the distance from the POI sensible to the force model (ham) [measured in Pixel];
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.Magnet = function(maxAttraction, POI, gradient, hapticallyActiveMargins) {
	/**
	 * @constructor:
	 */
	/*Private variable:-------------------------------------------------------------------------------------------*/
	var _maxAttraction = new jhaptic.Vector(0,0,0);
	var _POI = new jhaptic.Vector(0,0,0);
	var _gradient = new jhaptic.Vector(0,0,0);
	var _hapticallyActiveMargins = new jhaptic.Vector(0,0,0);
	
	//Methods that have direct access to private variables or methods:
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 						   (it is needed to obtain the current position of the pointer);
	 * @returns {Vector} force calculated using the current parameters;
	 */
	 function model(device) {
		var force = new Array(0,0,0);
		var position = new jhaptic.Vector(0,0,0);
		// gets the current device position, converts it to pixel unit and store it in 'position' Array:
		position.setVector(device.getPosition().dividedByScalar(device.getPixelWidth()));
		for (var i=0; i<3; i++){
			// if (point-POI)!=0 (the cursor isn't in the POI position) and |point-POI|<=ham (the cursor is 'near' the POI):
			if ((position.getElement(i) - _POI.getElement(i)) != 0 && Math.abs(position.getElement(i) - _POI.getElement(i)) <= _hapticallyActiveMargins.getElement(i)){
				// calculates force F=-[kx,ky,kz]/([posX,posY,posZ]-[POIx,POIy,POIz])^[gradX,gradY,gradZ]:
				// (the values of the vector _POI is converted from Pixel, that identifies the position
				// of the Point Of Interest on the page, to Meter, that identifies the position of the
				// Point Of Interest into the physical workspace), same conversion is done for _maxAttraction:
				force[i] = -(_maxAttraction.getElement(i)/Math.pow(position.getElement(i)-(_POI.getElement(i)), _gradient.getElement(i)));
				console.log('_maxAttraction:'+_maxAttraction+' position:'+position+' _POI:'+_POI+' _gradient:'+_gradient+'  result:'+ force.toString());
			}
		}
		return force.toVector();
	}
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	 /**
		 * Gets the value of the maximum attraction;
		 * @returns {Vector};
		 */
		this.getMaxAttraction = function(){
			return _maxAttraction;
		}
		
		/**
		 * Sets the value of the maximum attraction;
		 * @param {Vector} value;
		 */
		this.setMaxAttraction = function(value){
			if (value instanceof jhaptic.Vector){
				_maxAttraction.setVector(value);
			} else throw 'WrongMaxAttractionTypeException';
		}
		
		/**
		 * Gets the value of the point of interest;
		 * @returns {Vector};
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
		
		/**
		 * Gets the value of the gradient;
		 * @returns {Vector};
		 */
		this.getGradient = function(){
			return _gradient;
		}
		
		/**
		 * Sets the value of the gradient;
		 * @param {Vector} value: 0<=value<=1;
		 */
		this.setGradient = function(value){
			if (value instanceof jhaptic.Vector){
				for (var i=0; i<3; i++){
					if (value.valueOf(i) < 0 || value.valueOf(i) > 1){
						throw 'InvalidGradientValueException';
					}
				}
				_gradient.setVector(value);
			} else throw 'WrongGradientTypeException';
		}
		
		/**
		 * Gets the haptically active margins;
		 * @returns {Vector};
		 */
		this.getHapticallyActiveMargins = function(){
			return _hapticallyActiveMargins;
		}
		
		/**
		 * Sets the value for the haptically active margins;
		 * @param {Vector} value: ;
		 */
		this.setHapticallyActiveMargins = function(value){
			if (value instanceof jhaptic.Vector){
				for (var i=0; i<3; i++){
					if (value.valueOf(i) < 0){
						throw 'NegativeHAMValueException';
					}
				}
				_hapticallyActiveMargins.setVector(value);
			} else throw 'WrongHAMTypeException';
		}
		
		// Sets the value passed to the constructor ensuring that is a valid object;
		this.setMaxAttraction(maxAttraction);
		this.setPOI(POI);
		this.setGradient(gradient);
		this.setHapticallyActiveMargins(hapticallyActiveMargins);
		jhaptic.ForceModel.call(this, model);
}

jhaptic.Magnet.prototype = new jhaptic.ForceModel(function(){});
jhaptic.Magnet.prototype.constructor = jhaptic.Magnet;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Magnet object;
 * @returns {String} containing Magnet parameters;
 */
jhaptic.Magnet.prototype.toString = function(){
	return "<b>Magnet </b><i>(Max Attraction: ["+this.getMaxAttraction().toString()+"] N*px, POI: ["+this.getPOI().toString()+"] px, gradient: ["+
		this.getGradient().toString()+"], HAM: ["+this.getHapticallyActiveMargins().toString()+"] px)</i>";
}
