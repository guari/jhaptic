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
 * Defines a 3-dimensional vector and provides some methods for running common operations on it;
 * @param {Number} x: number value;
 * @param {Number} y: number value;
 * @param {Number} z: number value;
 * @author Andrea Guarinoni
 */
jhaptic.Vector = function(x,y,z) {	
	/**
	 * @constructor
	 */
	/*Private variables:-----------------------------------------------------------------------------------------*/
	//checks if the coordinates entered are valid
	//and puts them in the new Vector object
	// (if the constructor is called without passing
	// the arguments, sets coordinate to default value 0):
	var X = checkNum(x || 0,"Vector initialization, value of 'X' private variable");
	var Y = checkNum(y || 0,"Vector initialization, value of 'Y' private variable");
	var Z = checkNum(z || 0,"Vector initialization, value of 'Z' private variable");
	
	/*Private methods:----------------------------------------------------------------------------------------*/

	/**
	 * Checks if the coordinate entered ('obj') is a valid entry, it's a simple function used to prevent inconsistent values in Vector elements.
	 * Verifies that 'obj' is a number, if it's not valid it will throw an exception.
	 * @param {Object} obj: object to be checked;
	 * @param {String} context: string describing the context in which the method is called (it'll be used to identify an error);
	 * @returns {Number} n: eg. 3-> 3, "aa"-> NaN, "-2"-> -2;
	 * @throws InvalidNumberException;
	 */
	function checkNum(obj, context) {
        var n = Number(obj);
        if (isNaN(n)) {
            showMessage("error", "Error: "+context+" - The input value (<i>type: </i><b>"+typeof obj+"</b><i> value: </i>"+obj+
                ") is not a valid Number.");
            throw "InvalidNumberException";
        }
        return n;
	}
	
	/**
	 * Shows messages on the message box of JHaptic console when log function is active;
	 * @param {String} cmd: the command to use;
	 * @param {String} arg: the message to be displayed;
	 */
	function showMessage(cmd, arg){
		if ((cmd=="log" || cmd=="warn" || cmd=="error" || cmd=="inspect") && window.console[cmd]){
			window.console[cmd](arg);
		}
	}

	/*Privileged methods that have direct access to private variables:------------------------------------*/
	/**
	 * @returns {Number} x-coordinate value in current Vector
	 */
	this.getX = function(){ 
		return X;
	}
	/**
	 * @returns {Number} y-coordinate value in current Vector
	 */
	this.getY = function(){
		return Y;
	}

	/**
	 * @returns{Number}  z-coordinate value in current Vector
	 */
	this.getZ = function(){
		return Z;
	}

	/**
	 * @param {Number} x-coordinate value to be set
	 */
	this.setX = function(x){
		X = checkNum(x,"Vector.setX() method, value of 'x' parameter");
	}

	/**
	 * @param {Number} y-coordinate value to be set
	 */
	this.setY = function(y){
		Y = checkNum(y,"Vector.setY() method, value of 'y' parameter");
	}

	/**
	 * @param {Number} z-coordinate value to be set
	 */
	this.setZ = function(z){
		Z = checkNum(z,"Vector.setZ() method, value of 'z' parameter");
	}
	
	/**
	 * @param {Number} x-coordinate value to be set
	 * @param {Number} y-coordinate value to be set
	 * @param {Number} z-coordinate value to be set
	 */
	this.set = function(x,y,z){
		this.setX(x);
		this.setY(y);
		this.setZ(z);
	}
	
	/**
	 * Assigns the value of 'vector' to 'this' (works like a trusted assignment: this=vector)
	 * @param {Vector} vector: vector to be set
	 */
	this.setVector = function(vector){
		this.setX(vector.getX());
		this.setY(vector.getY());
		this.setZ(vector.getZ());
	}

	
	//i metodi che seguono potevano anche essere implementati al di fuori della function Vector utilizzando prototype
	//ed accedendo ai valori di X,Y,Z tramite i metodi this.set-() e this.get-(), sono stati inseriti qui solo per avere espressioni pi� leggibili.
	/**
	 * @returns {Number} magnitude (length) of the Vector;
	 */
	this.getMagnitude = function(){
		return Number(Math.sqrt(X*X+Y*Y+Z*Z));
	}
	
	/**
	 *Increases X coordinate by 'xIncrement';
	 *@param {Number} xIncrement;
	 */
	this.xTranslate = function(xIncrement){
		this.setX(X + checkNum(xIncrement,"Vector.xTranslate() method, value of 'xIncrement' parameter"));
	}
	
	/**
	 *Increases Y coordinate by 'yIncrement';
	 *@param {Number} yIncrement;
	 */
	this.yTranslate = function(yIncrement){
		this.setY(Y + checkNum(yIncrement,"Vector.yTranslate() method, value of 'yIncrement' parameter"));
	}
	
	/**
	 *Increases Z coordinate by 'zIncrement';
	 *@param {Number} zIncrement;
	 */
	this.zTranslate = function(zIncrement){
		this.setZ(Z + checkNum(zIncrement,"Vector.zTranslate() method, value of 'zIncrement' parameter"));
	}
	
	/**
	 *Given a translation Vector, 'moves' the current Vector
	 *(same behavior of Vector.sumWith(Vector) but changes the value of 'this');
	 *@param {Vector} translation: translation Vector;
	 */
	this.translate = function(translation){
		this.xTranslate(translation.getX());
		this.yTranslate(translation.getY());
		this.zTranslate(translation.getZ());
	}
	
	/**
	 * Scales the Vector 'this' multiplying it for a scalar 'scaleFactor';
	 * @param {Number} scaleFactor;
	 */
	this.scale = function(scaleFactor){
		scaleFactor = checkNum(scaleFactor, "Vector.scale() method, value of 'scaleFactor' parameter");
		this.setX(X * scaleFactor);
		this.setY(Y * scaleFactor);
		this.setZ(Z * scaleFactor);
	}
	
	/**
	 * @param {Number} degrees: rotation degree along the x-axis;
	 */
	this.xRotate = function(degrees){
		degrees = checkNum(degrees,"Vector.xRotate() method, value of 'degree' parameter");
		radians = degrees*Math.PI/180.0;
		newY = Y*Math.cos(radians)-Z*Math.sin(radians);
		newZ = Y*Math.sin(radians)+Z*Math.cos(radians);
		this.setY(newY);
		this.setZ(newZ);
	}
	
	/**
	 * @param degrees: {Number} rotation degree along the y-axis;
	 */
	this.yRotate = function(degrees){
		degrees = checkNum(degrees,"Vector.yRotate() method, value of 'degree' parameter");
		radians = degrees*Math.PI/180.0;
		newZ = Z*Math.cos(radians)-X*Math.sin(radians);
		newX = Z*Math.sin(radians)+X*Math.cos(radians);
		this.setZ(newZ);
		this.setX(newX);
	}
	
	/**
	 * @param degrees: {Number} rotation degree along the z-axis;
	 */
	this.zRotate = function(degrees){
		degrees = checkNum(degrees,"Vector.zRotate() method, value of 'degree' parameter");
		radians = degrees*Math.PI/180.0;
		newX = X*Math.cos(radians)-Y*Math.sin(radians);
		newY = X*Math.sin(radians)+Y*Math.cos(radians);
		this.setX(newX);
		this.setY(newY);
	}
	
	/**
	 * @returns {Vector} inverseVector;
	 */
	this.getInverse = function(){
		inverseVector = new jhaptic.Vector(X*-1.0,Y*-1.0,Z*-1.0);
		return inverseVector;
	}
	
	/**
	 * @param {Vector} vectorToReach;
	 */
	this.reach = function(vectorToReach){
		var REACH_SLOWNESS = 10.0;
		var xDistance = Math.abs(X-vectorToReach.getX());
		var yDistance = Math.abs(Y-vectorToReach.getY());
		var zDistance = Math.abs(Z-vectorToReach.getZ());
		if (X>vectorToReach.getX()){ 
			this.setX(X - xDistance/REACH_SLOWNESS);
		}
		else { 
			this.setX(X + xDistance/REACH_SLOWNESS);
		}
		if (Y>vectorToReach.getY()){
			this.setY(Y - yDistance/REACH_SLOWNESS);
		}
		else {
			this.setY(Y + yDistance/REACH_SLOWNESS);
		}
		if (Z>vectorToReach.getZ()){
			this.setZ(Z - zDistance/REACH_SLOWNESS);
		}
		else {
			this.setZ(Z + zDistance/REACH_SLOWNESS);
		}
	}
	
	/**
	 * Calculate the scalar distance between 'point' and 'this'.
	 * @param {Vector} point;
	 * @returns {Number} distance;
	 */
	this.getScalarDistance = function(point){
			var distance = Number(Math.sqrt(Math.pow(point.getX()-X, 2) + Math.pow(point.getY()-Y, 2) + Math.pow(point.getZ()-Z, 2)));
			return distance;
	}
	
	/**
	 * @param {Number} maxValue: the maximum magnitude;
	 * @returns {Vector} the current Vector scaled in order not to exceed maxValue;
	 */
	this.getLimitedByMagnitude = function(maxValue){
		var result = new jhaptic.Vector(0,0,0);
		result.setVector(this);
		if (this.getMagnitude() > maxValue){
			// Scales vector coordinates to'fit' the max magnitude:
			result.setVector(this.getVersor().multipliedByScalar(maxValue));
			showMessage("warn", "Warning: Vector value ["+this.toString()+"] exceeds maximum magnitude ("+this.getMagnitude()+">"+maxValue+").");
		}
		return result;
	}
	
}

/*Public methods:---------------------------------------------------------------------------------------------*/

/**
 * @returns {Vector} versor of the current Vector;
 */
jhaptic.Vector.prototype.getVersor = function(){
	var length = this.getMagnitude();
	return  this.multipliedByScalar(length>0 ? 1/length : 0);
}

/**
 * @param {Vector} vector;
 * @returns {Vector} sum=this+vector;
 */
jhaptic.Vector.prototype.plus = function(vector){
	var sum = new jhaptic.Vector(0,0,0);
	sum.setX(this.getX() + vector.getX());
	sum.setY(this.getY() + vector.getY());
	sum.setZ(this.getZ() + vector.getZ());
	return sum;
}

/**
 * @param {Vector} vector;
 * @returns  {Vector} difference=this-vector
 */
jhaptic.Vector.prototype.minus = function(vector){
	var difference = new jhaptic.Vector(0,0,0);
	difference.setX(this.getX() - vector.getX());
	difference.setY(this.getY() - vector.getY());
	difference.setZ(this.getZ() - vector.getZ());
	return difference;
}

/**
 * @param {Vector} vector;
 * @returns {Vector} product=this*vector
 */
jhaptic.Vector.prototype.multipliedBy = function(vector){
	var product = new jhaptic.Vector(0,0,0);
	product.setX(this.getX() * vector.getX());
	product.setY(this.getY() * vector.getY());
	product.setZ(this.getZ() * vector.getZ());
	return product;
}

/**
 * @param {Vector} vector;
 * @returns {Vector} quotient=this/vector
 */
jhaptic.Vector.prototype.dividedBy = function(vector){
	var quotient = new jhaptic.Vector(0,0,0);
	quotient.setX(this.getX() / vector.getX());
	quotient.setY(this.getY() / vector.getY());
	quotient.setZ(this.getZ() / vector.getZ());
	return quotient;
}

/**
 * @param {Number} number;
 * @returns {Vector} sum=this+number;
 */
jhaptic.Vector.prototype.plusScalar = function(number){
	var sum = new jhaptic.Vector(0,0,0);
	sum.setX(this.getX() + number);
	sum.setY(this.getY() + number);
	sum.setZ(this.getZ() + number);
	return sum;
}

/**
 * @param {Number} number;
 * @returns  {Vector} difference=this-number
 */
jhaptic.Vector.prototype.minusScalar = function(number){
	var difference = new jhaptic.Vector(0,0,0);
	difference.setX(this.getX() - number);
	difference.setY(this.getY() - number);
	difference.setZ(this.getZ() - number);
	return difference;
}

/**
 * @param {Number} number;
 * @returns {Vector} product=this*number
 */
jhaptic.Vector.prototype.multipliedByScalar = function(number){
	var product = new jhaptic.Vector(0,0,0);
	product.setX(this.getX() * number);
	product.setY(this.getY() * number);
	product.setZ(this.getZ() * number);
	return product;
}

/**
 * @param {Number} number;
 * @returns {Vector} quotient=this/number
 */
jhaptic.Vector.prototype.dividedByScalar = function(number){
	var quotient = new jhaptic.Vector(0,0,0);
	quotient.setX(this.getX() / number);
	quotient.setY(this.getY() / number);
	quotient.setZ(this.getZ() / number);
	return quotient;
}

/**
 * Overwrites toString() method for Vector object;
 * @returns {String} containing Vector values;
 */
jhaptic.Vector.prototype.toString = function(){
	return this.getX()+","+this.getY()+","+this.getZ();
}

/**
 * Gets the element with the passed index of a Vector object;
 * @param {Number} index: [0,1,2];
 * @returns {Number}
 */
jhaptic.Vector.prototype.getElement = function(index){
	if (isNaN(index)) throw new TypeError("["+this.toString()+"].getElement(index): index="+index+" is not a Number");
	var result;
	if (index == 0) result = this.getX();
	else if (index == 1) result = this.getY();
	else if (index == 2) result = this.getZ();
	return result;
}

/**
 * Converts a Vector into an Array
 * @returns {Array}
 */
jhaptic.Vector.prototype.toArray = function(){
	return new Array(this.getX(),this.getY(),this.getZ());
}
