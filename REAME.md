JHaptic
-------

JHaptic library is meant to be a prototypal framework to extend the user experience into ordinary Web pages with haptic interaction. The library is completely developed in Javascript. The JS code is responsible for the computation of the force and for the association of the haptic interaction to specific widgets or contents of the page.
A browser plug-in is provided to enable the interaction within the browser with the physical device through the APIs exposed by it. The developed plug-in has been designed to be used with NPAPI-compliant browsers, e.g., *Mozilla Firefox*, *Google Chrome*, *Safari*, etc.
Among all the browsers, Google Chrome has been adopted as test platform and for plug-in integration is used *Firebreath* framework (http://www.firebreath.org).

A sample HTML page with very basic use-case can be found in ```\Samples\``` folder, you can play with it by using the virtual device API.

If you own a real haptic device and want to test it with this, a browser plug-in and a device driver is needed. You can find the one for *Sensable Phantom Omni* device in ```\Plugin\Bin\nphaptic.dll```
(eg. to load it in Chrome you can embed the plug-in DLL into a basic *Chrome Extension*, or simply execute the .BAT files that you find into ```\Plugin\Bin\``` folder).
Since the plug-in DLL is simply a bridge between the JS library and the device driver you could have to install the second one, you can find it into ```Extra``` folder.

Finally, by using the ad-hoc JS console provided you can handle the output logs and monitor the device states by enabling it directly at web page level (for both real and virtual device).

![screenshot](https://raw.github.com/guari/jhaptic/master/JS-Framework/Images/JHConsole.jpg)

### Notes:

The library is meant to expose methods that can be associated to events (e.g. *mouseover*, *mouseout*, etc.) or to any element (visible or not) of the Document Object Model (DOM). The library manages the whole rendering process and exploits the browser plug-in to access the APIs needed to interact with the physical device.
In order to allow Web contents browsing, the mouse cursor has been firmly associated to the end-effector of the haptic device so that a movement of it produces a proportional shift in the position of the mouse arrow on the screen. This way, the user can do actions and fire events as with the usual mice, and haptic effects ca be rendered (started, stopped, etc.) upon a particular occurring condition (e.g., click on a button, hovering a link, missing data in an input field, etc.) of a given element (or node) of the page.

The library may supports any kind of device, from (2D) mice to haptic devices moving in a 3D working space: in the latter case, the position of the haptic proxy must be mapped into the bi-dimensional position of the pointer on the screen; in our model, the user screen space has been vertically centered onto the workspace of the physical device, represented as a parallelepiped. The currently displayed area of the Web page (viewport) is conceived as a vertical flat surface, so that the three-dimensional position of the end-effector is projected on the vertical plane in which the Web page resides, thus providing the bidimensional coordinates of the mouse on the screen.

License
-------

Copyright (c) 2011 Politecnico di Milano
This is open source software, licensed under the GNU General Public License. See the file COPYING for details.