/*jslint node:true, nomen:true */

/*
 * lib/xbee-rx.js
 * https://github.com/101100/xbee-rx
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */


var parambulator = require('parambulator');
var R = require('ramda');
var rx = require('rx');
var SerialPort = require('serialport');
var util = require('util');
var xbee_api = require('xbee-api');


var constructorOptionsSpec = {
    serialport: 'required$, string$',
    required$: 'module',
    module: { enum$: [ "802.15.4", "ZNet", "ZigBee" ] },
    api_mode: { enum$: [ 1, 2 ] },
    serialportOptions: 'object$',
    defaultTimeoutMs: { type$: 'integer', min$: 10 }
};


var localCommandOptionsSpec = {
    command: 'required$, string$',
    commandParameter: { type$: [ 'string', 'array' ] },
    timeoutMs: { type$: 'integer', min$: 10 }
};


var remoteCommandOptionsSpec = {
    command: 'required$, string$',
    commandParameter: { type$: [ 'string', 'array' ] },
    exactlyone$: [ 'destinationId', 'destination64', 'destination16' ],
    destinationId: { type$: [ 'string' ] },
    destination64: { type$: [ 'string', 'array' ] },
    destination16: { type$: [ 'string', 'array' ] },
    timeoutMs: { type$: 'integer', min$: 10 }
};


var remoteTransmitOptionsSpec = {
    data: 'required$, string$',
    exactlyone$: [ 'destinationId', 'destination64', 'destination16' ],
    destinationId: { type$: [ 'string' ] },
    destination64: { type$: [ 'string', 'array' ] },
    destination16: { type$: [ 'string', 'array' ] },
    timeoutMs: { type$: 'integer', min$: 10 }
};


module.exports = function xbeeRxLibrary(options) {

    "use strict";

    var cachedNodes = {},
        debug = false,
        debugSubscription,
        defaultTimeoutMs,
        frameSource,
        frameSourceConnection,
        module,
        serialport,
        xbeeAPI;


    function closeEverything() {
        if (debug) {
            console.log("Disposing debug frame subscription");
            debugSubscription.dispose();

            console.log("Disposing serial port connection");
        }
        frameSourceConnection.dispose();

        if (debug) {
            console.log("Closing serial port");
        }

        serialport.drain(function closeAfterDraining() {
            serialport.close();
        });
    }


    function _createFilter(frameId, frameType) {
        return function deferredResolverCallback(receivedFrame) {
            return receivedFrame.id === frameId && receivedFrame.type === frameType;
        };
    }


    // Returns a stream that will (when subscribed to) send the given frame and
    // emit the response frame(s) (or error with a timeout).
    // A broadcast can result in more than one response frame.
    function _sendFrameStreamResponse(frame, timeoutMs, responseFrameType) {
        var frameId = xbeeAPI.nextFrameId(),
            sendStream,
            resultStream;

        // Set the frame ID and create the callback to check for it
        frame.id = frameId;

        // Results are the frames matching the frame ID and response type
        resultStream = frameSource
            .where(_createFilter(frameId, responseFrameType));

        sendStream = rx.Observable.create(function (observer) {
            if (debug) {
                console.log("Debug frame (out):\n", xbeeAPI.buildFrame(frame));
            }

            // Write to the serialport (when open or now if open)
            if (serialport.paused) {
                serialport.on("open", function () {
                    serialport.write(xbeeAPI.buildFrame(frame));
                    observer.onCompleted();
                });
            } else {
                serialport.write(xbeeAPI.buildFrame(frame));
                observer.onCompleted();
            }
        });

        // Return our result stream with a timeout
        return rx.Observable
            .merge(sendStream, resultStream)
            .timeout(timeoutMs, rx.Observable.throw(new Error("Timed out after " + timeoutMs + " ms")));
    }


    function _localCommand(command, timeoutMs, commandParameter) {
        var frame = {
                type: xbee_api.constants.FRAME_TYPE.AT_COMMAND,
                command: command,
                commandParameter: commandParameter
            };

        if (debug) {
            console.log("Doing local command", command, "with parameter", commandParameter || []);
        }

        return _sendFrameStreamResponse(frame, timeoutMs, xbee_api.constants.FRAME_TYPE.AT_COMMAND_RESPONSE)
            .map(function (frame) {
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


    // Returns a stream that will emit the 64 bit address of the node
    // with the given node identifier.
    function _lookupByNodeIdentifier(nodeIdentifier, timeoutMs) {
        // if the address is cached, return that
        if (cachedNodes[nodeIdentifier]) {
            return rx.Observable.return(cachedNodes[nodeIdentifier]);
        }

        if (debug) {
            console.log("Looking up", nodeIdentifier);
        }

        return _localCommand('DN', timeoutMs, nodeIdentifier)
            .catch(rx.Observable.throw(new Error("Node not found")))
            .map(_extractDestination64)
            .do(function (address64) {
                // cache the address
                cachedNodes[nodeIdentifier] = address64;
            });
    }


    // Sends a the given command and parameter to the given destination.
    // A stream is returned that will emit to the resulting command data
    // on success or end in an Error with the failed status as the text.
    // Only one of destination64 or destination16 should be given; the
    // other should be undefined.
    function _remoteCommand(command, destination64, destination16, timeoutMs, commandParameter) {
        var frame = {
                type: xbee_api.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST,
                command: command,
                commandParameter: commandParameter,
                destination64: destination64,
                destination16: destination16
            };

        if (debug) {
            console.log("Sending", command, "to", destination64, "with parameter", commandParameter || []);
        }

        return _sendFrameStreamResponse(frame, timeoutMs, xbee_api.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE)
            .map(function (frame) {
                if (frame.commandStatus === xbee_api.constants.COMMAND_STATUS.OK) {
                    return frame.commandData;
                }

                // if not OK, throw error
                throw new Error(xbee_api.constants.COMMAND_STATUS[frame.commandStatus]);
            });
    }


    // Sends a the given data to the given destination.  A stream is
    // returned that will complete on success or end in an Error with the
    // failed status as the text.  Only one of destination64 or
    // destination16 should be given; the other should be undefined.
    function _remoteTransmit(destination64, destination16, data, timeoutMs) {
        var frame = {
                data: data,
                type: xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST,
                destination64: destination64,
                destination16: destination16
            },
            responseFrameType = xbee_api.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS;

        if (module === "802.15.4") {
            responseFrameType = xbee_api.constants.FRAME_TYPE.TX_STATUS;
            frame.type = destination64 ?
                    xbee_api.constants.FRAME_TYPE.TX_REQUEST_64 :
                    xbee_api.constants.FRAME_TYPE.TX_REQUEST_16;
        }

        if (debug) {
            console.log("Sending '" + data + "' to", destination64 || destination16);
        }

        return _sendFrameStreamResponse(frame, timeoutMs, responseFrameType)
            .flatMap(function (frame) {
                if (frame.deliveryStatus === xbee_api.constants.DELIVERY_STATUS.SUCCESS) {
                    return rx.Observable.empty();
                }

                // if not OK, throw error
                return rx.Observable.throw(new Error(xbee_api.constants.DELIVERY_STATUS[frame.deliveryStatus]));
            });
    }


    // Validate the destination found within the given settings object.
    // The existence of exactly one of destinationId, destination64 and
    // destination16 and their types are assumed to already be verified.
    // This function must ensure that destination64 is the correct
    // length, if it exists, destination16 is the correct length, if it
    // exists, and destinationId was used only if the module type was
    // not '802.15.4'.
    function _validateDestination(settings) {
        var hexRegex = /^[0-9a-f]+$/;

        if (settings.destinationId && module === '802.15.4') {
            throw new Error("'destinationId' is not supported by 802.15.4 modules. Use 'destination16' or 'destination64' instead.");
        }

        if (typeof settings.destination64 === "string") {
            if (settings.destination64.length !== 16) {
                throw new Error("'destination64' is not the correct length. It must be a hex string of length 16 or a byte array of length 8.");
            }
            if (!settings.destination64.match(hexRegex)) {
                throw new Error("'destination64' is not a hex string. It must be a hex string of length 16 or a byte array of length 8.");
            }
        } else if (util.isArray(settings.destination64)) {
            if (settings.destination64.length !== 8) {
                throw new Error("'destination64' is not the correct length. It must be a hex string of length 16 or a byte array of length 8.");
            }
            settings.destination64.forEach(function (element) {
                if (typeof element !== "number" || element < 0 || element > 255) {
                    throw new Error("'destination64' is not a byte array. It must be a hex string of length 16 or a byte array of length 8.");
                }
            });
        }

        if (typeof settings.destination16 === "string") {
            if (settings.destination16.length !== 4) {
                throw new Error("'destination16' is not the correct length. It must be a hex string of length 4 or a byte array of length 2.");
            }
            if (!settings.destination16.match(hexRegex)) {
                throw new Error("'destination16' is not a hex string. It must be a hex string of length 4 or a byte array of length 2.");
            }
        } else if (util.isArray(settings.destination16)) {
            if (settings.destination16.length !== 2) {
                throw new Error("'destination16' is not the correct length. It must be a hex string of length 4 or a byte array of length 2.");
            }
            settings.destination16.forEach(function (element) {
                if (typeof element !== "number" || element < 0 || element > 255) {
                    throw new Error("'destination16' is not a byte array. It must be a hex string of length 4 or a byte array of length 2.");
                }
            });
        }
    }


    // Validates that a command is the correct length (two characters).
    function _validateCommand(command) {
        if (command.length !== 2) {
            throw new Error("'command' must be a string of length 2.");
        }
    }


    function localCommand(settings) {
        var command,
            commandParameter,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeoutMs;

        parambulator(localCommandOptionsSpec).validate(settings || {}, function (err) {
            if (err) {
                throw err;
            }
        });

        _validateCommand(settings.command);

        command = settings.command;

        commandParameter = settings.commandParameter || [];

        return _localCommand(command, timeoutMs, commandParameter);
    }


    function remoteCommand(settings) {
        var command,
            commandParameter,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeoutMs;

        parambulator(remoteCommandOptionsSpec).validate(settings || {}, function (err) {
            if (err) {
                throw err;
            }
        });

        _validateDestination(settings);

        _validateCommand(settings.command);

        command = settings.command;

        commandParameter = settings.commandParameter || [];

        if (settings.destination64 || settings.destination16) {
            return _remoteCommand(command, settings.destination64, settings.destination16, timeoutMs, commandParameter);
        }

        if (settings.destinationId) {
            return _lookupByNodeIdentifier(settings.destinationId, timeoutMs)
                .flatMap(function (lookupResult) {
                    return _remoteCommand(command, lookupResult, undefined, timeoutMs, commandParameter);
                });
        }
    }


    function monitorIODataPackets() {
        return frameSource
            .where(R.propEq("type", xbee_api.constants.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX));
    }


    function monitorTransmissions() {
        return frameSource
            .where(R.propEq("type", xbee_api.constants.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET));
    }


    function remoteTransmit(settings) {
        var data,
            timeoutMs = (settings && settings.timeoutMs) || defaultTimeoutMs;

        parambulator(remoteTransmitOptionsSpec).validate(settings || {}, function (err) {
            if (err) {
                throw err;
            }
        });

        _validateDestination(settings);

        data = settings.data;

        if (settings.destination64 || settings.destination16) {
            return _remoteTransmit(settings.destination64, settings.destination16, data, timeoutMs);
        }

        if (settings.destinationId) {
            return _lookupByNodeIdentifier(settings.destinationId, timeoutMs)
                .flatMap(function (lookupResult) {
                    return _remoteTransmit(lookupResult, undefined, data, timeoutMs);
                });
        }
    }


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Initialization
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


    parambulator(constructorOptionsSpec).validate(options || {}, function (err) {
        if (err) {
            throw err;
        }
    });

    module = options.module;

    xbeeAPI = new xbee_api.XBeeAPI({
        api_mode: options.api_mode || 1,
        module: module
    });

    options.serialportOptions = options.serialportOptions || {};

    options.serialportOptions.parser = xbeeAPI.rawParser();

    if (options.debug) {
        debug = true;
    }

    if (debug) {
        console.log("Connecting to serialport", options.serialport);
    }
    serialport = new SerialPort(options.serialport, options.serialportOptions);

    frameSource = rx.Observable.fromEvent(xbeeAPI, 'frame_object').publish();

    frameSourceConnection = frameSource.connect();

    defaultTimeoutMs = options.defaultTimeoutMs || 5000;

    if (debug) {
        debugSubscription = frameSource.subscribe(function (frame) {
            console.log("Debug frame (in):\n", frame);
        });
    }

    return {
        allPackets: frameSource,
        close: closeEverything,
        localCommand: localCommand,
        monitorTransmissions: monitorTransmissions,
        monitorIODataPackets: monitorIODataPackets,
        remoteCommand: remoteCommand,
        remoteTransmit: remoteTransmit
    };

}; // end of xbeeRxLibrary
