/*jslint node:true, nomen:true */

/*
 * test/mock-serialport.js
 * https://github.com/101100/xbee-promise
 *
 * Mock serial port used to test xbee-promise library.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 *
 * Inspired by firmata MockSerialPort:
 *
 * https://raw.githubusercontent.com/jgautier/firmata/5f1afcca29436ef60ea0649bdea317d769cecfcf/test/MockSerialPort.js
 * Copyright (c) 2011 Julian Gautier <julian.gautier@alumni.neumont.edu>
 * Licensed under the MIT license.
 */

"use strict";

var mockdata = {
    path: null,
    options: null,
    lastWrite: null,
    opened: false,
    closed: false,
    closedBeforeDrained: false,
    drained: false
};

function MockSerialPort(path, options) {
    mockdata.path = path;
    mockdata.options = options;
    mockdata.opened = true;
}

MockSerialPort.prototype.write = function (data) {
    mockdata.lastWrite = data;
};

MockSerialPort.prototype.close = function () {
    mockdata.closedBeforeDrained = !mockdata.drained;
    mockdata.closed = true;
};

MockSerialPort.prototype.drain = function (callback) {
    mockdata.drained = true;
    callback();
};

module.exports = mockdata;

module.exports.SerialPort = MockSerialPort;
