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
 *Defines a Vibration force model object F=A*sin(w*t).
*@param {Vector} amplitude: amplitude of the sine wave which determines the vibration (A) [measured in Newton];
*@param {Vector} omega: angular frequency (w) [measured in Rad/Seconds] (w=2*PI/T=2*PI*f);
*@extends ForceModel;
*@author Andrea Guarinoni
*/
jhaptic.Vibration = function(amplitude, omega) {
	/**
	 * @constructor:
	 */
	/*Private variables:----------------------------------------------------------------------------------------------------*/
	var _A = new jhaptic.Vector(0,0,0);
	var _w = new jhaptic.Vector(0,0,0);
	
	/*Private method:-------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force values;
	 * @param {Device} device: the device for which the force shall be calculated
	 * 						   (it is needed to obtain the current time);
	 * @returns {Vector} force: Force calculated using the current parameters;
	 */
	function model(device) {
		// istante di tempo in cui viene calcolata l'intensita' della forza la cui variazione determinera' l'effetto di vibrazione (t):
		// gets the current working time:
		var t = device.getTimeElapsed();  // [milliseconds]
		var force = new jhaptic.Vector(0,0,0);
		// calculates force F=[Ax,Ay,Az]*sin([wx, wy, wz]*t):
		force.setVector(_A.multipliedBy(Math.sinVector(_w.multipliedByScalar(t/1000))));
		return force;
	}
	
	/*Privileged method:-------------------------------------------------------------------------------------------------*/
	/**
	 * Gets the value of the amplitude;
	 */
	this.getAmplitude = function(){
		return _A;
	}
	
	/**
	 * Sets the value of the amplitude;
	 * @param {Vector} value;
	 */
	this.setAmplitude = function(value){
		if (value instanceof jhaptic.Vector){
			_A.setVector(value);
		} else throw 'WrongAmplitudeTypeException';
	}
	
	/**
	 * Gets the value of the angular frequency;
	 */
	this.getOmega = function(){
		return _w;
	}
	
	/**
	 * Sets the value of the angular frequency;
	 * @param {Vector} value;
	 */
	this.setOmega = function(value){
		if (value instanceof jhaptic.Vector){
			_w.setVector(value);
		} else throw 'WrongOmegaTypeException';
	}
	
	// Sets the values passed to the constructor ensuring that are valid objects;
	this.setAmplitude(amplitude);
	this.setOmega(omega);
	jhaptic.ForceModel.call(this, model);
}

jhaptic.Vibration.prototype = new jhaptic.ForceModel(function(){});
jhaptic.Vibration.prototype.constructor = jhaptic.Vibration;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for Vibration object;
 * @returns {String} containing Vibration parameters;
 */
jhaptic.Vibration.prototype.toString = function(){
	return "<b>Vibration </b><i>(Amplitude: ["+this.getAmplitude().toString()+"] N, Omega: ["+this.getOmega().toString()+"] rad/s)</i>";
}
