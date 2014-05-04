/*jslint node:true, unparam:false, nomen:true */

/*
 * xbee-promise
 * https://github.com/101100/xbee-promise
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

var parambulator = require('parambulator');
var q = require('q');
var SerialPort = require('serialport').SerialPort;
var xbee_api = require('xbee-api');
var util = require('util');


var optionsSpec = {
    serialport: 'required$, string$',
    api_mode: { enum$: [1, 2] },
    serialportOptions: 'object$',
    defaultTimeout: { gt$: 1000, type$: 'integer' }
};


module.exports = function xbeePromiseLibrary(options) {
    "use strict";

    var xbeeAPI,
        serialport,
        cachedNodes = {},
        debug = false,
        defaultTimeout;


    function closeSerialport() {
        if (debug) {
            console.log("Closing serial port");
        }

        serialport.drain(function closeAfterDraining() {
            serialport.close();
        });
    }


    function _createCallback(deferred, frameId, frameType) {
        return function deferredResolverCallback(receivedFrame) {
            if (receivedFrame.id === frameId && receivedFrame.type === frameType) {
                // This is our frame's response. Resolve the promise.
                deferred.resolve(receivedFrame);
            }
        };
    }


    // Returns a promise that will resolve to the response for the given
    // frame that will be sent.
    function _sendFramePromiseResponse(frame, timeoutMs, responseFrameType) {
        var frameId = xbeeAPI.nextFrameId(),
            deferred = q.defer(),
            callback;

        // Set the frame ID and create the callback to check for it
        frame.id = frameId;
        callback = _createCallback(deferred, frameId, responseFrameType);

        // Attach callback so we're waiting for the response
        xbeeAPI.on("frame_object", callback);

        // Write to the serialport (when open or now if open)
        if (serialport.paused) {
            serialport.on("open", function () {
                serialport.write(xbeeAPI.buildFrame(frame));
            });
        } else {
            serialport.write(xbeeAPI.buildFrame(frame));
        }

        // Return our promise with a timeout
        return deferred.promise.timeout(timeoutMs).fin(function () {
            // clean up: remove listener after the promise is complete (for any reason)
            xbeeAPI.removeListener("frame_object", callback);
        });
    }


    function _localCommand(command, timeoutMs, commandParameter) {
        var frame = {
                type: xbee_api.constants.FRAME_TYPE.AT_COMMAND,
                command: command,
                commandParameter: commandParameter
            };

        if (debug) {
            console.log("Doing local command ", command, "with parameter", commandParameter || []);
        }

        return _sendFramePromiseResponse(frame, timeoutMs, xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE)
            .then(function (frame) {
                if (frame.commandStatus === xbee_api.constants.COMMAND_STATUS.OK) {
                    return frame.commandData;
                }

                // if not OK, throw error
                throw new Error(xbee_api.constants.COMMAND_STATUS[frame.commandStatus]);
            });
    }


    function _extractDestination64(commandData) {
        // Result in commandData is 16 bit address as two bytes,
        // followed by 64 bit address as 8 bytes.  This function
        // returns the 64 bit address.

        var address64 = commandData.slice(2, 10);

        if (debug) {
            console.log("Extracted 64 bit address:", address64);
        }

        return address64;
    }


    // Returns a promise that will resolve to the 64 bit address of the node
    // with the given node identifier.
    function _lookupByNodeIdentifier(nodeIdentifier, timeoutMs) {
        // if the address is cached, return that wrapped in a promise
        if (cachedNodes[nodeIdentifier]) {
            return q(cachedNodes[nodeIdentifier]);
        }

        if (debug) {
            console.log("Looking up", nodeIdentifier);
        }

        return _localCommand('DN', timeoutMs, nodeIdentifier)
            .then(_extractDestination64, function errorHandler() {
                // any error from _sendFramePromiseResponse implies node not found
                throw new Error("Node not found");
            })
            .then(function (address64) {
                // cache result
                cachedNodes[nodeIdentifier] = address64;
                return address64;
            });
    }


    function _remoteCommand(command, destination64, timeoutMs, commandParameter) {
        var frame = {
                type: xbee_api.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
                command: command,
                commandParameter: commandParameter,
                destination64: destination64
            };

        if (debug) {
            console.log("Sending", command, "to", destination64, "with parameter", commandParameter || []);
        }

        return _sendFramePromiseResponse(frame, timeoutMs, xbee_api.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE)
            .then(function (frame) {
                if (frame.commandStatus === xbee_api.constants.COMMAND_STATUS.OK) {
                    return frame.commandData;
                }

                // if not OK, throw error
                throw new Error(xbee_api.constants.COMMAND_STATUS[frame.commandStatus]);
            });
    }


    function _remoteTransmit(destination64, data, timeoutMs) {
        var frame = {
                type: xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
                destination64: destination64,
                data: data
            };

        if (debug) {
            console.log("Sending '" + data + "' to", destination64);
        }

        return _sendFramePromiseResponse(frame, timeoutMs, xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS)
            .then(function (frame) {
                if (frame.deliveryStatus === xbee_api.constants.DELIVERY_STATUS.SUCCESS) {
                    return true;
                }

                // if not OK, throw error
                throw new Error(xbee_api.constants.DELIVERY_STATUS[frame.deliveryStatus]);
            });
    }


    function localCommand(settings) {
        var command,
            commandParameter,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeout;

        if (typeof settings !== "object" || typeof settings.command !== "string") {
            throw new Error("Expected a settings object with string property 'command'");
        }

        command = settings.command;

        if (util.isArray(settings.commandParameter) || typeof settings.commandParameter === "string") {
            commandParameter = settings.commandParameter;
        } else if (settings.commandParameter) {
            throw new Error("Settings property 'commandParameter' must be an array or a string");
        }

        return _localCommand(command, timeoutMs, commandParameter);
    }


    function remoteCommand(settings) {
        var command,
            commandParameter,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeout;

        if (typeof settings !== "object" || typeof settings.command !== "string") {
            throw new Error("Expected a settings object with string property 'command'");
        }

        command = settings.command;

        if (util.isArray(settings.commandParameter) || typeof settings.commandParameter === "string") {
            commandParameter = settings.commandParameter;
        } else if (settings.commandParameter) {
            throw new Error("Settings property 'commandParameter' must be an array or a string");
        }

        if (settings.destination64 && !util.isArray(settings.destination64) && typeof settings.destination64 !== "string") {
            throw new Error("Settings property 'destination64' must be an array or a string");
        }

        if (settings.destinationId && typeof settings.destinationId !== "string") {
            throw new Error("Settings property 'destinationId' must be a string");
        }

        if (settings.destination64) {
            return _remoteCommand(command, settings.destination64, timeoutMs, commandParameter);
        }

        if (settings.destinationId) {
            return _lookupByNodeIdentifier(settings.destinationId, timeoutMs)
                .then(function (lookupResult) {
                    cachedNodes[settings.destinationId] = lookupResult;
                    return _remoteCommand(command, lookupResult, timeoutMs, commandParameter);
                });
        }
    }


    // TODO test!
    function remoteTransmit(settings) {
        var data,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeout;

        if (typeof settings !== "object" || typeof settings.data !== "string") {
            throw new Error("Expected a settings object with string property 'data'");
        }

        data = settings.data;

        if (settings.destination64 && !util.isArray(settings.destination64) && typeof settings.destination64 !== "string") {
            throw new Error("Settings property 'destination64' must be an array or a string");
        }

        if (settings.destinationId && typeof settings.destinationId !== "string") {
            throw new Error("Settings property 'destinationId' must be a string");
        }

        if (settings.destination64) {
            return _remoteTransmit(settings.destination64, data, timeoutMs);
        }

        if (settings.destinationId) {
            return _lookupByNodeIdentifier(settings.destinationId, timeoutMs)
                .then(function (lookupResult) {
                    cachedNodes[settings.destinationId] = lookupResult;
                    return _remoteTransmit(lookupResult, data, timeoutMs);
                });
        }
    }


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Initialization
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    parambulator(optionsSpec).validate(options, function (err) {
        if (err) {
            throw err;
        }
    });

    xbeeAPI = new xbee_api.XBeeAPI({
        api_mode: options.api_mode || 1
    });

    options.serialportOptions.parser = xbeeAPI.rawParser();

    // serialport = new SerialPort(options.serialport, {
    //     baudrate: 57600,
    //     parser: xbeeAPI.rawParser()
    // });

    serialport = new SerialPort(options.serialport, options.serialportOptions);

    if (options.debug) {
        debug = true;
    }

    defaultTimeout = options.defaultTimeout || 5000;

    if (debug) {
        xbeeAPI.on("frame_object", function (frame) {
            console.log("Debug frame:\n", frame);
        });
    }


    return {
        localCommand: localCommand,
        remoteCommand: remoteCommand,
        remoteTransmit: remoteTransmit,
        close: closeSerialport
    };
}; // end of xbeePromiseLibrary
