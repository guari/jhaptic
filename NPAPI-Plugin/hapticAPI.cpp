/*
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
 * @Author: Nino El Hariry, Andrea Guarinoni
 */

/**********************************************************\

  Auto-generated hapticAPI.cpp

\**********************************************************/

#include "JSObject.h"
#include "variant_list.h"
#include "DOM/Document.h"

#include "hapticAPI.h"
#include <Windows.h>

//Include Phantom device library
#include "hdPhantom.h"
#pragma comment(lib,"hdPhantom.lib")


///////////////////////////////////////////////////////////////////////////////
/// @fn hapticAPI::hapticAPI(const hapticPtr& plugin, const FB::BrowserHostPtr host)
///
/// @brief  Constructor for your JSAPI object.  You should register your methods, properties, and events
///         that should be accessible to Javascript from here.
///
/// @see FB::JSAPIAuto::registerMethod
/// @see FB::JSAPIAuto::registerProperty
/// @see FB::JSAPIAuto::registerEvent
///////////////////////////////////////////////////////////////////////////////
hapticAPI::hapticAPI(const hapticPtr& plugin, const FB::BrowserHostPtr& host) : m_plugin(plugin), m_host(host)
{
    registerMethod("echo",      make_method(this, &hapticAPI::echo));
    registerMethod("testEvent", make_method(this, &hapticAPI::testEvent));

	//Register JHaptic library properties
	registerProperty("numDevice",		make_property(this, &hapticAPI::getNumDevice));
	registerProperty("initialized",		make_property(this, &hapticAPI::getStatus));
	registerProperty("deviceType",		make_property(this, &hapticAPI::getDeviceType));
	registerProperty("maxForce",		make_property(this, &hapticAPI::getMaxForce));
	registerProperty("workspaceSize",	make_property(this, &hapticAPI::getWorkspaceSize));
	registerProperty("position",		make_property(this, &hapticAPI::getPosition));
	registerProperty("pixel",			make_property(this, &hapticAPI::getPixelWidth));


	//Register JHaptic library methods
	registerMethod("startDevice",	make_method(this, &hapticAPI::startDevice));
	registerMethod("stopDevice",	make_method(this, &hapticAPI::stopDevice));
	registerMethod("sendForce",		make_method(this, &hapticAPI::sendForce));
	registerMethod("setContext",	make_method(this, &hapticAPI::setContext));




    // Read-write property
    registerProperty("testString",
                     make_property(this,
                        &hapticAPI::get_testString,
                        &hapticAPI::set_testString));

    // Read-only property
    registerProperty("version",
                     make_property(this,
                        &hapticAPI::get_version));

	//State variables initialization
	initialized			 =	false;
	deviceID			 =  getNumDevice()-1;
	InitializedString	 =	"Initialized";
	NotInitializedString =	"Not initialized";
	ConnectionString	 =	"Connection opened";
	DisconnectionString	 =	"Connection closed";

	setPixelWidth();
}

///////////////////////////////////////////////////////////////////////////////
/// @fn hapticAPI::~hapticAPI()
///
/// @brief  Destructor.  Remember that this object will not be released until
///         the browser is done with it; this will almost definitely be after
///         the plugin is released.
///////////////////////////////////////////////////////////////////////////////
hapticAPI::~hapticAPI()
{
}

///////////////////////////////////////////////////////////////////////////////
/// @fn hapticPtr hapticAPI::getPlugin()
///
/// @brief  Gets a reference to the plugin that was passed in when the object
///         was created.  If the plugin has already been released then this
///         will throw a FB::script_error that will be translated into a
///         javascript exception in the page.
///////////////////////////////////////////////////////////////////////////////
hapticPtr hapticAPI::getPlugin()
{
    hapticPtr plugin(m_plugin.lock());
    if (!plugin) {
        throw FB::script_error("The plugin is invalid");
    }
    return plugin;
}



// Read/Write property testString
std::string hapticAPI::get_testString()
{
    return m_testString;
}
void hapticAPI::set_testString(const std::string& val)
{
    m_testString = val;
}

// Read-only property version
std::string hapticAPI::get_version()
{
    return "CURRENT_VERSION";
}

// Method echo
FB::variant hapticAPI::echo(const FB::variant& msg)
{
    static int n(0);
    fire_echo(msg, n++);
    return msg;
}

void hapticAPI::testEvent(const FB::variant& var)
{
    fire_fired(var, true, 1);
}

//*****************************************************
//*****************************************************
//*****************************************************
//*****************************************************
//*****************************************************

int hapticAPI::getNumDevice()
{
	return hdPhantomGetNumDevices();
}

FB::variant hapticAPI::getStatus()
{
	return initialized;
}

FB::variant hapticAPI::startDevice(void){

	if (!initialized){
		if ( hdPhantomOpen(deviceID)!=-1)	{
			hdPhantomStartServo();
			initialized = true;
			return (FB::variant)initialized;
		}
	}

	return initialized;
}

FB::variant hapticAPI::stopDevice(void)
{
	if (initialized){
		if (hdPhantomClose(deviceID)!=-1){
			hdPhantomStopServo();
			initialized=false;
			return true;
		}
	}

	return false;
}

FB::variant hapticAPI::sendForce(std::string str)
{
	double force[3];
	stringToArray(str,force);
	force[1] = -force[1];
	if (hdPhantomSetForce(deviceID, /*Z*/&force[2], /*X*/&force[0], /*Y*/ &force[1])!=-1)
		return true;
	else
		return false;
}


FB::variant hapticAPI::getDeviceType()
{
	char type[20];

	if (hdPhantomGetType(deviceID, type) == -1)
		return NotInitializedString;
	else
		return type;
}

FB::variant hapticAPI::getPosition()
{
	if (initialized){
		hdPhantomGetPosition(deviceID, &position[0],&position[1],&position[2]);

		double buf[3];
		if (strcmp(context.c_str(),"2d")==0){
			buf[0] = position[1]+0.1+offsetX;
			buf[1] = -(position[2]-0.1)+offsetY;
			buf[2] = position[0];
			double x = (buf[0]/pixelWidth);
			double y = (buf[1]/pixelWidth);
			mouseRenderPosition(x,y);
			if (leftButton())
				mouseRenderLeftButton();
		}
		else{
			buf[0] = position[1];
			buf[1] = -position[2];
			buf[2] = -position[0];
		}

		std::string pos = arrayToString(buf);

		return pos;
	}

	return NotInitializedString;
}

void hapticAPI::stringToArray(std::string str, double* val)
{
	char* c = (char*)str.c_str();
	char* num;
	int i=0;

	//strcpy(c,str.c_str());
	num = strtok (c,",");
	while (num != NULL)
	{
		val[i] = atof(num);
		i++;
		num = strtok (NULL, ",");
	}
}

std::string hapticAPI::arrayToString(double* val)
{
	std::stringstream out;
	out << val[0];
	out << ",";
	out << val[1];
	out << ",";
	out << val[2];
	return out.str();
}

FB::variant hapticAPI::setContext(std::string str)
{
	//2D o 3D

	if (strcmp(str.c_str(),"3d")||strcmp(str.c_str(),"2d")){
		context = str;
		return context;
	}
	else
		return false;

}

FB::variant hapticAPI::getWorkspaceSize()
{
	std::string pos=arrayToString(workspaceSize);
	return pos;
}

FB::variant hapticAPI::getPixelWidth(){
	return pixelWidth;
}

bool hapticAPI::leftButton()
{
	int status = hdPhantomGetButtons(deviceID);

	if (status == 1)
		return true;
	else
		return false;
}

bool hapticAPI::rightButton()
{
	int status = hdPhantomGetButtons(deviceID);

	if (status==2){

		return true;
	}
	else
		return false;
}

void hapticAPI::setPixelWidth(){
	res[0]=1440;
	res[1]=900;
	workspaceSize[0] = 0.20;
	workspaceSize[1] = 0.20;
	workspaceSize[2] = 0.055;

	pixelWidth = workspaceSize[0] / res[0];
	if (workspaceSize[1] < (res[1] * pixelWidth) )
			pixelWidth = workspaceSize[1] / res[1];

	offsetX = (workspaceSize[0] - res[0]*pixelWidth)/2;
	offsetY = (workspaceSize[1] - res[1]*pixelWidth)/2;
}

void hapticAPI::mouseRenderPosition(double pos_x, double pos_y){
	SetCursorPos(pos_x,pos_y);


}

void hapticAPI::mouseRenderLeftButton(){
	INPUT input[1];
	ZeroMemory(input, 1*sizeof(INPUT));

	input[0].type = INPUT_MOUSE;
	input[0].mi.dwExtraInfo = GetMessageExtraInfo();
	input[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP;

	SendInput(1, input, sizeof(INPUT));

	/*
	typedef struct tagINPUT {
		DWORD type;		= INPUT_MOUSE:		The event is a mouse event. Use the mi structure of the union.
						= INPUT_KEYBOARD:	The event is a keyboard event. Use the ki structure of the union.
						= INPUT_HARDWARE:	The event is a hardware event. Use the hi structure of the union

		union {
			MOUSEINPUT    mouse;
			KEYBDINPUT    ki;
			HARDWAREINPUT hi;
		};
	} INPUT
					typedef struct tagMOUSEINPUT {
								  LONG      dx;
								  LONG      dy;
								  DWORD     mouseData;
								  DWORD     dwFlags;
								  DWORD     time;
								  ULONG_PTR dwExtraInfo;
					} MOUSEINPUT


					INPUT input

					//input.type = INPUT_MOUSE;
					//input.mi.dx = ;  //coordinate assolute o incrementali rispetto all'ultima posizione, depending on dwFlags
					//input.mi.dy = ;  //coordinate assolute o incrementali rispetto all'ultima posizione, depending on dwFlags
					//input.mi.dwFlags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTUP;
					//input.mi.dwExtraInfo = GetMessageExtraInfo();

	*/
}