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

var stream = require("stream");
var xbeeApi = require("xbee-api");


var mockdata = {
    options: null,
    opened: false,
    emitFrame: null,
    lastFrameId: 0,
};

function MockXBeeAPI(options) {
    mockdata.options = options;
    mockdata.opened = true;

    var self = this;
    this.builder = new stream.Transform( { objectMode: true } );
    this.builder._transform = function (frame, _enc, cb) {
        self.builder.push(self.buildFrame(frame));
        cb();
    };

    this.parser = new stream.Transform( { objectMode: true } );
    this.parser._transform = function (frame, _enc, cb) {
        self.parser.push(frame);
        cb();
    };
}

MockXBeeAPI.prototype.buildFrame = function (frame) {
    frame.built = true;
    return frame;
};

MockXBeeAPI.prototype.nextFrameId = function () {
    mockdata.lastFrameId += 1;
    return mockdata.lastFrameId;
};

module.exports = mockdata;

module.exports.XBeeAPI = MockXBeeAPI;

module.exports.constants = xbeeApi.constants;
