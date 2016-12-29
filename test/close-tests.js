/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/close-tests.js
 * https://github.com/101100/xbee-rx
 *
 * Tests for the xbee-rx library close function.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

require("should");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeeRx = proxyquire("../lib/xbee-rx.js", {
    "serialport": mockserialport.MockSerialPort,
    "xbee-api": mockXbeeApi
});

describe("xbee-rx", function () {

    describe("close", function () {

        var xbee;

        beforeEach(function () {
            xbee = xbeeRx({
                serialport: "serialport path",
                module: "ZigBee"
            });
        });

        it("drains and then closes serialport", function () {

            mockserialport.drained.should.equal(false);
            mockserialport.closed.should.equal(false);
            mockserialport.closedBeforeDrained.should.equal(false);

            xbee.close();

            mockserialport.drained.should.equal(true);
            mockserialport.closed.should.equal(true);
            mockserialport.closedBeforeDrained.should.equal(false);

        });

    });

});
