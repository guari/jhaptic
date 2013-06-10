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
 * Defines a VirtualWall force model object Fout(t)=-Fin(t-1), this model can be used to emulate a virtual wall touch sensation.
 * @extends ForceModel;
 * @author Andrea Guarinoni
 */
jhaptic.VirtualWall = function() {
	/**
	 * @constructor:
	 */
	
	/*Private method:------------------------------------------------------------------------------------------------*/
	/**
	 * Provides the model used to calculate the force value
	 * @param {Device} device: the device for which the force shall be calculated
	 * 						   (it is needed to obtain the current force input on the end-effector);
	 * @returns {Vector} force;
	 */
	function model(device) {
		var force = new jhaptic.Vector(0,0,0);
		force.setVector(device.getForceInput().getInverse());
		return force;
	}

	jhaptic.ForceModel.call(this, model);
}

jhaptic.VirtualWall.prototype = new jhaptic.ForceModel(function(){});
jhaptic.VirtualWall.prototype.constructor = jhaptic.VirtualWall;

/*Public methods:---------------------------------------------------------------------------------------------*/
/**
 * Overwrites toString() method for VirtualWall object;
 * @returns {String};
 */
jhaptic.VirtualWall.prototype.toString = function(){
	return "<b>VirtualWall </b><i>()</i>";
}
