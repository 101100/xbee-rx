/*jslint node:true, nomen:true */

/*
 * test/mock-serialport.js
 * https://github.com/101100/xbee-promise
 *
 * Mock serialport used to test xbee-promise library.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 *
 * Inspired by firmata MockSerialPort:
 *
 * https://raw.githubusercontent.com/jgautier/firmata/5f1afcca29436ef60ea0649bdea317d769cecfcf/test/MockSerialPort.js
 * Copyright (c) 2011 Julian Gautier <julian.gautier@alumni.neumont.edu>
 * Licensed under the MIT license.
 */

"use strict";

var stream = require("stream");
var util = require("util");


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
    stream.Duplex.call(this, { objectMode: true });
    this.paused = false;
    this.nextFrame = null;
    // this.pause();

    mockdata.path = path;
    mockdata.options = options;
    mockdata.opened = true;
    mockdata.emitFrame = this.emitFrame.bind(this);
}

util.inherits(MockSerialPort, stream.Duplex);

MockSerialPort.prototype.close = function () {
    mockdata.closedBeforeDrained = !mockdata.drained;
    mockdata.closed = true;
};

MockSerialPort.prototype.drain = function (callback) {
    mockdata.drained = true;
    callback();
};

MockSerialPort.prototype.emitFrame = function (frame) {
    this.emit("data", frame);
};

MockSerialPort.prototype._read = function () {
    // do nothing as we emit data in emitFrame
};

MockSerialPort.prototype._write = function (frame, _enc, cb) {
    mockdata.lastWrite = frame;
    cb();
};

module.exports = mockdata;

module.exports.MockSerialPort = MockSerialPort;
