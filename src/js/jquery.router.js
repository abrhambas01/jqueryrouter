/**
 * jQuery router plugin
 * This file contains SPA router methods to handle routing mechanism in single page applications (SPA). Supported versions IE9+, Chrome, Safari, Firefox
 *
 * @project      Jquery Routing Plugin
 * @date         2018-11-25
 * @author       Sachin Singh <ssingh.300889@gmail.com>
 * @dependencies jQuery
 * @version      2.0.0
 */

import deparam from 'jquerydeparam';
import { select as $ } from './helpers/select';

// Object containing a map of attached handlers
const libs = {
    handlers: []
};
// Variable to check if browser supports history API properly    
const isHistorySupported = history && history.pushState;

// Data cache
const cache = {
    noTrigger: false
};

// Regular expressions
const regex = {
    pathname: /^\/(?=[^?]*)/,
    routeparams: /:[^\/]+/g,
    hashQuery: /\?.+/
};

// Supported events
const eventNames = {
    routeChanged: "routeChanged",
    hashchange: "hashchange",
    popstate: "popstate"
};

// Error messages
const errorMessage = {
    invalidPath: "Path is invalid"
};

/**
 * Converts any list to JavaScript array
 * @param {array} arr 
 */
function _arr(arr) {
    return Array.prototype.slice.call(arr);
}

/**
 * Tests if parameter is a valid JavaScript object
 * @param {any} testObject Test object
 */
function _resolveObject(testObject) {
    if (testObject !== null && typeof testObject === 'object') {
        return testObject;
    }
    return {};
}

/**
 * Triggers "routeChanged" event unless "noTrigger" flag is true
 */
function _triggerRoute(route, eventType, isHashRoute = false) {
    if (
        cache.noTrigger
        && eventType === eventNames.hashchange
    ) {
        cache.noTrigger = false;
        return;
    }
    cache.data = _resolveObject(cache.data);
    let ref = cache.data.data = _resolveObject(cache.data.data);
    let routeOb = {
        eventType: eventType,
        hash: !!isHashRoute,
        route: route
    };
    cache.data.data = {
        ...ref,
        ...routeOb
    };
    router.events.trigger(eventNames.routeChanged, cache.data);
}

/**
 * Throw JavaScript errors with custom message
 * @param {string} message 
 */
function _throwError(message) {
    throw new Error(message);
}

/**
 * Checks if given route is valid
 * @param {string} sRoute 
 */
function _isValidRoute(sRoute) {
    if (typeof sRoute !== "string") {
        return false;
    };
    return regex.pathname.test(sRoute);
}

/**
 * Adds a query string
 * @param {string} sRoute 
 * @param {string} qString 
 * @param {boolean} appendQString 
 */
function _resolveQueryString(sRoute, qString, appendQString) {
    if (!qString && !appendQString) return sRoute;
    if (typeof qString === "string") {
        if ((qString = qString.trim()) && appendQString) {
            return sRoute + window.location.search + "&" + qString.replace("?", "");
        } else if (qString) {
            return sRoute + "?" + qString.replace("?", "");
        } else {
            return sRoute;
        }
    }
}

/**
 * Converts current query string into an object
 */
function _getQueryParams() {
    let qsObject = deparam(window.location.search),
        hashStringParams = {};
    if (window.location.hash.match(regex.hashQuery)) {
        hashStringParams = deparam(window.location.hash.match(regex.hashQuery)[0]);
    }
    return {
        ...qsObject,
        ...hashStringParams
    };
}

/**
 * Checks if route is valid and returns the valid route
 * @param {string} sRoute
 * @param {string} qString
 * @param {boolean} appendQString
 */
function _validateRoute(sRoute, qString, appendQString) {
    if (_isValidRoute(sRoute)) {
        return _resolveQueryString(sRoute, qString, appendQString);
    }
    _throwError(errorMessage.invalidPath);
}

/**
 * Set route for given view
 * @param {string|object} oRoute 
 * @param {boolean} replaceMode 
 * @param {boolean} noTrigger 
 */
function _setRoute(oRoute, replaceMode, noTrigger) {
    if (!oRoute) return;
    let title = null,
        sRoute = "",
        qString = "",
        appendQString = false,
        isHashString = false,
        routeMethod = replaceMode ? "replaceState" : "pushState";
    cache.noTrigger = noTrigger;
    if (typeof oRoute === "object") {
        cache.data = {
            data: oRoute.data
        };
        title = oRoute.title;
        sRoute = oRoute.route;
        qString = oRoute.queryString;
        appendQString = oRoute.appendQuery;
    } else if (typeof oRoute === "string") {
        cache.data = {
            data: {}
        };
        sRoute = oRoute;
    }
    // Support for hash routes
    if (sRoute.charAt(0) === "#") {
        isHashString = true;
        sRoute = sRoute.replace("#", "");
    }
    if (isHistorySupported && !isHashString) {
        history[routeMethod](cache.data, title, _validateRoute(sRoute, qString, appendQString));
        if (!noTrigger) {
            let routeOb = {
                eventType: eventNames.popstate,
                hash: false,
                route: sRoute
            };
            let ref = cache.data.data;
            cache.data.data = {
                ...ref,
                ...routeOb
            };
            router.events.trigger(eventNames.routeChanged, cache.data);
        }
    } else {
        if (replaceMode) {
            window.location.replace("#" + _validateRoute(sRoute, qString, appendQString));
        } else {
            window.location.hash = _validateRoute(sRoute, qString, appendQString);
        }
    }
}

/**
 * Attaches a route handler function
 * @param {string} sRoute 
 * @param {function} callback 
 */
function _route(sRoute, callback) {
    if (!libs.handlers.filter(ob => (
        ob.originalHandler === callback
        && ob.route === sRoute
        && ob.element === this
    )).length) {
        libs.handlers.push({
            eventName: eventNames.routeChanged,
            originalHandler: callback,
            handler: callback.bind(this),
            element: this,
            route: sRoute
        });
    }
}


/**
 * Trims leading/trailing special characters
 * @param {string} param 
 */
function _sanitize(str) {
    return str.replace(/^([^a-zA-Z0-9]+)|([^a-zA-Z0-9]+)$/g, "");
}

/**
 * Compares route with current URL
 * @param {string} route 
 * @param {string} url 
 * @param {object} params 
 */
function _matched(route, url, params) {
    if (~url.indexOf("?")) {
        url = url.substring(0, url.indexOf("?"));
    }
    regex.routeparams.lastIndex = 0;
    if (regex.routeparams.test(route)) {
        params.params = {};
        const pathRegex = new RegExp(route.replace(/\//g, "\\/").replace(/:[^\/\\]+/g, "([^\\/]+)"));
        if (pathRegex.test(url)) {
            regex.routeparams.lastIndex = 0;
            let keys = _arr(route.match(regex.routeparams)).map(_sanitize),
                values = _arr(url.match(pathRegex));
            values.shift();
            keys.forEach(function (key, index) {
                params.params[key] = values[index];
            });
            return true;
        }
    } else {
        return ((route === url) || (route === "*"));
    }
    return false;
}

/**
 * Triggers a router event
 * @param {string} eventName 
 * @param {object} params 
 */
function _routeTrigger(eventName, params) {
    // Ensures that params is always an object
    params = _resolveObject(params);
    params.data = _resolveObject(params.data);
    const isHashRoute = params.data.hash;
    libs.handlers.forEach(function (eventObject) {
        if (eventObject.eventName === eventName) {
            if (isHistorySupported && !isHashRoute && _matched(eventObject.route, window.location.pathname, params)) {
                eventObject.handler(params.data, params.params, _getQueryParams());
            } else if (isHashRoute) {
                if (!window.location.hash && !isHistorySupported && _matched(eventObject.route, window.location.pathname, params)) {
                    cache.data = params.data;
                    window.location.replace("#" + window.location.pathname); // <-- This will trigger router handler automatically
                } else if (_matched(eventObject.route, window.location.hash.substring(1), params)) {
                    eventObject.handler(params.data, params.params, _getQueryParams());
                }
            }
        }
    });
}

/**
 * Initializes router events
 */
function _bindRouterEvents() {
    $(window).on(eventNames.popstate, function (e) {
        _triggerRoute.apply(this, [window.location.pathname, e.type]);
    });
    $(window).on(eventNames.hashchange, function (e) {
        _triggerRoute.apply(this, [window.location.hash, e.type, true]);
    });
}

const router = {
    events: {
        ...eventNames,
        trigger(eventName, params) {
            return _routeTrigger.apply(this, [eventName, params]);
        }
    },
    init: function () {
        let settings = {
            eventType: (isHistorySupported ? eventNames.popstate : eventNames.hashchange),
            hash: !isHistorySupported,
            route: (isHistorySupported ? window.location.pathname : window.location.hash)
        };
        this.events.trigger(eventNames.routeChanged, {
            data: settings
        });
        if (window.location.hash) {
            $(window).trigger(eventNames.hashchange);
        }
    },
    set() {
        return _setRoute.apply(this, arguments);
    },
    historySupported: isHistorySupported
}

function route() {
    return _route.apply(this, arguments);
}

// Adds the router object to jQuery if available
if (typeof jQuery === 'function' && jQuery.fn) {
    jQuery.route = jQuery.fn.route = route;
    jQuery.router = router;
}

_bindRouterEvents();

export { router, route };