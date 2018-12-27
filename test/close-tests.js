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

var proxyquire = require("proxyquire").noCallThru();
require("should");

var mockSerialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeeRx = proxyquire("../lib/xbee-rx.js", {
    "serialport": mockSerialport.MockSerialPort,
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

            mockSerialport.drained.should.equal(false);
            mockSerialport.closed.should.equal(false);
            mockSerialport.closedBeforeDrained.should.equal(false);

            xbee.close();

            mockSerialport.drained.should.equal(true);
            mockSerialport.closed.should.equal(true);
            mockSerialport.closedBeforeDrained.should.equal(false);

        });

    });

});
