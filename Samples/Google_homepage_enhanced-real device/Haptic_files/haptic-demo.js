/**
 * This script is a demo that extends Google homepage with haptic effects using JHaptic library;
 * @author Andrea Guarinoni
 */

/**
 * contentLoaded:
 * Summary: cross-browser wrapper for DOMContentLoaded
 * License: MIT
 * http://javascript.nwbox.com/ContentLoaded/
 * @param win: window reference;
 * @param fn: function reference;
 */
function contentLoaded(win, fn) {
    var done = false, top = true,
        doc = win.document, root = doc.documentElement,
        add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
        rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
        pre = doc.addEventListener ? '' : 'on',

        init = function(e) {
            if (e.type == 'readystatechange' && doc.readyState != 'complete') return;
            (e.type == 'load' ? win : doc)[rem](pre + e.type, init, false);
            if (!done && (done = true)) fn.call(win, e.type || e);
        },

        poll = function() {
            try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
            init('poll');
        };

    if (doc.readyState == 'complete') fn.call(win, 'lazy');
    else {
        if (doc.createEventObject && root.doScroll) {
            try { top = !win.frameElement; } catch(e) { }
            if (top) poll();
        }
        doc[add](pre + 'DOMContentLoaded', init, false);
        doc[add](pre + 'readystatechange', init, false);
        win[add](pre + 'load', init, false);
    }
}

// Once the page DOM is loaded (before that the window.onload is fired):
contentLoaded(window, function(){

    /*_______________________________________Define and set haptic effects____________________________________________*/

    // Create a new haptic device:
    var dev = new jhaptic.Device(); // Use real device

    /* Only for debug: -----------------------------------------------------------------------------------------------*/
    // Enable console for log messages:
    dev.enableConsoleLog();
    /*----------------------------------------------------------------------------------------------------------------*/

    // Init device:
    dev.init();
    // Enable the context 2D in which the haptic cursor coordinates will be acquired:
    dev.setContext("2d");

    // Enable the loop to render the effect on the device:
    dev.startRenderer();

    /*----------------------------------------------------------------------------------------------------------------*/
    // Set an attraction effect to the search field where is entered the text (id='lst-ib'):
    // Define a spring force model:
    var k = new jhaptic.Vector(20, 20, 0); // value of elastic constant
    var searchFieldPosition = document.getElementById('lst-ib').getPositionOnPage();
    var poi = new jhaptic.Vector(searchFieldPosition.x, searchFieldPosition.y, 0); // value of point of interest
    var mySpring = new jhaptic.Spring(k,poi);
    // Create an haptic effect that has as model mySpring and an infinite max duration:
    var searchFieldAttraction = new jhaptic.Effect(mySpring, 0);
    // Start to play the effect as soon as the page is loaded (so no start parameter is specified)
    // Disable the effect when the cursor goes over the search box:
    searchFieldAttraction.setRemovalParam(document.getElementById('lst-ib'), 'mousemove');
    // finally add it to the web page:
    searchFieldAttraction.enable(dev);
    searchFieldAttraction.name = "searchBarAttraction";

    /*----------------------------------------------------------------------------------------------------------------*/
    // Set a viscous effect when the cursor moves into the search box (id='lst-ib'):
    k = new jhaptic.Vector(10000, 10000, 0); // value of viscous constant
    var myDamper = new jhaptic.Damper(k);
    // Create an haptic effect with myDamper as force model and a infinite max duration:
    var searchFieldViscosity = new jhaptic.Effect(myDamper, 0);
    // Start it when cursor goes over the search field:
    searchFieldViscosity.setStartupParam(document.getElementById('lst-ib'), 'mouseover');
    // Disable it when the cursor moves out the search field:
    searchFieldViscosity.setStopParam(document.getElementById('lst-ib'), 'mouseout');
    // and add it to the web page:
    searchFieldViscosity.enable(dev);
    searchFieldViscosity.name = "searchBarViscosity";

    /*----------------------------------------------------------------------------------------------------------------*/
    var effect1 = new jhaptic.Effect(new jhaptic.Vibration(new jhaptic.Vector(1,0,0), new jhaptic.Vector(20,0,0)),200);
    var effect2 = new jhaptic.Effect(new jhaptic.Vibration(new jhaptic.Vector(0,2,0), new jhaptic.Vector(0,30,0)),200);
    var test = new jhaptic.Behavior(new Array(effect1,effect2));
    test.setStartupParam(document, 'click');
    test.enable(dev,'chainOnStop', 1);
});