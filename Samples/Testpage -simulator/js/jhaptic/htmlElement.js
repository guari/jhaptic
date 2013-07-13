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
 * Set an handler for an event on a target, it's used to avoid compatibility
 * issues on old browser versions;
 * @param {String} eventType
 * @param {Function} fnHandler
 * @extends {Document}, {Element};
 * @author Andrea Guarinoni
 */
Object.prototype.addEventHandler =
Document.prototype.addEventHandler =
	Element.prototype.addEventHandler = function(eventType, fnHandler) {
    if (this.addEventListener) {
    	// for browser that follow W3C standard:
        this.addEventListener(eventType, fnHandler, false);
    } else if (this.attachEvent) {
    	// for old IE versions:
        this.attachEvent("on" + eventType, fnHandler);
    } else {
    	// if the other two fail...:
        this["on" + eventType] = fnHandler;
    }
}

/**
 * Remove an handler set for an event on a target, it's used to avoid compatibility
 * issues on old browser versions;
 * @param {String} eventType
 * @param {Function} fnHandler
 * @extends {Document}, {Element};
 * @author Andrea Guarinoni
 */
Object.prototype.removeEventHandler =
Document.prototype.removeEventHandler =
	Element.prototype.removeEventHandler = function(eventType, fnHandler) {
    if (this.removeEventListener) {
    	// for browser that follow W3C standard:
        this.removeEventListener(eventType, fnHandler, false);
    } else if (this.detachEvent) {
    	// for old IE versions:
        this.detachEvent("on" + eventType, fnHandler);
    } else {
    	// if the other two fail...:
        this["on" + eventType] = null;
    }
}

/**
 * Calculates the position of an html element in the page;
 * @returns {Array<x:{Number}, y:{Number}>} x and y of the object, relative to the top left corner of the page;
 * @extends {HTMLElement};
 */
HTMLElement.prototype.getPositionOnPage = function() {
	var obj = this;
	var pos = new Array();
	pos['left'] = 0;
	pos['top'] = 0;
	if (obj) {
		while (obj.offsetParent) {
			pos['left'] += obj.offsetLeft - obj.scrollLeft;
			pos['top'] += obj.offsetTop - obj.scrollTop;
			var tmp = obj.parentNode;
			while (tmp != obj.offsetParent) {
				pos['left'] -= tmp.scrollLeft;
				pos['top'] -= tmp.scrollTop;
				tmp = tmp.parentNode;
				}
			obj = obj.offsetParent;
			}
		pos['left'] += obj.offsetLeft;
		pos['top'] += obj.offsetTop;
		}
	return { x:pos['left'], y:pos['top'] };
	}

/**
 * Fire a custom event encapsulating optional data into the target 'this';
 * @param {String} eventType: the name of the event;
 * @param {Object} data: the object that we want to write when the event is fired
 * 						 and that will be read by the handler function of the event
 * 						 (data will be stored into this.eventData property);
 * @extends {Document}, {Element};
 */
Object.prototype.fireEvent =
Document.prototype.fireEvent =
	Element.prototype.fireEvent = function(eventType, data) {
	// Ready, create a generic event:
	var evt = document.createEvent("Event");
	// Aim, initialize it to be the event we want:
	// bubbling = true, cancelable = true
	evt.initEvent(eventType, true, true);
	// encapsulate data:
	if (data) this.eventData = data;
	// Fire!
	this.dispatchEvent(evt);
}

/**
 * Overwrites toString() method for HTMLElement object;
 * @returns {String} HTMLElement type name;
 * @extends {HTMLElement};
 */
HTMLElement.prototype.toString = function() {
	return this.localName.capitaliseFirst() + " element" +
		(this.id ? " with id='"+this.id+"'" : "");
}

/**
 * Overwrites toString() method for HTMLDocument object;
 * @returns {String};
 * @extends {HTMLDocument};
 */
Document.prototype.toString = function() {
    return "Document element";
}