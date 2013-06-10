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

  Auto-generated hapticAPI.h

\**********************************************************/

#include <string.h>
#include <stdio.h>
#include <sstream>
#include <boost/weak_ptr.hpp>
#include "JSAPIAuto.h"
#include "BrowserHost.h"
#include "haptic.h"

#ifndef H_hapticAPI
#define H_hapticAPI

class hapticAPI : public FB::JSAPIAuto
{
public:
    hapticAPI(const hapticPtr& plugin, const FB::BrowserHostPtr& host);
    virtual ~hapticAPI();

    hapticPtr getPlugin();

    // Read/Write property ${PROPERTY.ident}
    std::string get_testString();
    void set_testString(const std::string& val);

    // Read-only property ${PROPERTY.ident}
    std::string get_version();

    // Method echo
    FB::variant echo(const FB::variant& msg);

    // Event helpers
    FB_JSAPI_EVENT(fired, 3, (const FB::variant&, bool, int));
    FB_JSAPI_EVENT(echo, 2, (const FB::variant&, const int));
    FB_JSAPI_EVENT(notify, 0, ());

    // Method test-event
    void testEvent(const FB::variant& s);

	//Internal properties to handle JHaptic calls
	int deviceID;
	double position[3];
	bool initialized;
	const char* InitializedString;
	const char* NotInitializedString;
	const char* ConnectionString;
	const char* DisconnectionString;
	int res[2];
	double workspaceSize[3];
	double pixelWidth;
	double offsetX, offsetY;
	std::string context;


	//Internal methods to handle JHaptic calls
	int getNumDevice();
	void stringToArray(std::string, double*);
	std::string arrayToString(double*);
	void setPixelWidth();
	void mouseRenderPosition(double, double);
	void mouseRenderLeftButton();
	bool leftButton();
	bool rightButton();


	//Methods exposed to JHaptic library (Javascript level)
	FB::variant getStatus();
	FB::variant startDevice(void);
	FB::variant stopDevice(void);
	FB::variant sendForce(std::string);
	FB::variant getDeviceType();
	FB::variant getPosition();
	FB::variant getMaxForce() { /*Device specific*/ return 3.3; };
	FB::variant getWorkspaceSize();
	FB::variant setContext(std::string);
	FB::variant getPixelWidth();
	FB::variant getForceInput() { /*TODO: Return real value*/ return 3.3; };




private:
    hapticWeakPtr m_plugin;
    FB::BrowserHostPtr m_host;

    std::string m_testString;
};

#endif // H_hapticAPI

