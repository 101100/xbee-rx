/*jslint node:true, nomen:true */

/*
 * test/mock-xbee-api.js
 * https://github.com/101100/xbee-promise
 *
 * Mock xbee-api used to test xbee-promise library.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var events = require("events");
var util = require("util");
var xbeeApi = require("xbee-api");

var mockdata = {
    options: null,
    opened: false,
    emitFrame: null,
    lastFrameId: 0,
    parser: function fauxParser() { return; }
};

function MockXBeeAPI(options) {
    events.EventEmitter.call(this);

    mockdata.options = options;
    mockdata.opened = true;
    mockdata.emitFrame = this.emitFrame.bind(this);
}

util.inherits(MockXBeeAPI, events.EventEmitter);

MockXBeeAPI.prototype.buildFrame = function (frame) {
    frame.built = true;
    return frame;
};

MockXBeeAPI.prototype.emitFrame = function (frame) {
    this.emit("frame_object", frame);
};

// Parsing isn't actually needed
MockXBeeAPI.prototype.rawParser = function () {
    return mockdata.fauxParser;
};

MockXBeeAPI.prototype.nextFrameId = function () {
    mockdata.lastFrameId += 1;
    return mockdata.lastFrameId;
};

module.exports = mockdata;

module.exports.XBeeAPI = MockXBeeAPI;

module.exports.constants = xbeeApi.constants;
