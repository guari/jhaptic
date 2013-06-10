/**
 * Injects jhaptic library scripts and the haptic demo script into Google homepage html;
 * @author Andrea Guarinoni
 */

/*__________________________Loading JHaptic library files_______________________________*/

// Library files may simply be imported by placing all scripts into a single file
// that is invoked in the main html, as follows are loaded instead preserving the
// original structure divided into multiple files; in the main html is imported this file.

/**
 * Imports on the html page the files whose urls are passed as parameters;
 * @param {String}(optional, one url = one parameter, one or more are accepted)
 */
function importScript(){
  // Gets the url of the scripts that have to be imported:
  var scripts = arguments;
  
  var scriptElement = new Array(scripts.length);
  var headTag = document.getElementsByTagName("head")[0];
  var fragment = document.createDocumentFragment();
  
  for(var i=0, count = scripts.length; i < count; i++){
    scriptElement[i] = document.createElement("script");
    scriptElement[i].setAttribute("type", "text/javascript");
    scriptElement[i].setAttribute("src", scripts[i]);
    fragment.appendChild(scriptElement[i]);
  }
  
  headTag.appendChild(fragment);
}

// Imports the scripts:
importScript(// JHaptic library components:
            "./Haptic_files/jhaptic/function.js",
            "./Haptic_files/jhaptic/string.js",
            "./Haptic_files/jhaptic/array.js",
            "./Haptic_files/jhaptic/math.js",
            "./Haptic_files/jhaptic/htmlElement.js",
            "./Haptic_files/jhaptic/vector.js",
            "./Haptic_files/jhaptic/forceModel.js",
            "./Haptic_files/jhaptic/spring.js",
            "./Haptic_files/jhaptic/damper.js",
            "./Haptic_files/jhaptic/vibration.js",
            "./Haptic_files/jhaptic/mass.js",
            "./Haptic_files/jhaptic/magnet.js",
            "./Haptic_files/jhaptic/constantModel.js",
            "./Haptic_files/jhaptic/nullModel.js",
            "./Haptic_files/jhaptic/virtualWall.js",
            "./Haptic_files/jhaptic/device.js",
            "./Haptic_files/jhaptic/virtualDevice.js",
            "./Haptic_files/jhaptic/effect.js",
            "./Haptic_files/jhaptic/console.js",
            "./Haptic_files/jhaptic/messageBox.js",
            "./Haptic_files/jhaptic/graph.js",
            "./Haptic_files/jhaptic/controlGUI.js",
            "./Haptic_files/jhaptic/virtualWorkspace.js",
            "./Haptic_files/jhaptic/behavior.js",
            // the graphic library used by the console for 3d drawing:
            "./Haptic_files/three/THREE.js",
            // and finally the demo script that uses jhaptic library:
            "./Haptic_files/haptic-demo.js");
