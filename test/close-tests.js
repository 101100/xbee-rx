/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/close-tests.js
 * https://github.com/101100/xbee-promise
 *
 * Tests for the xbee-promise library close function.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var should = require("should");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeePromise = proxyquire("../lib/xbee-promise.js", {
    'serialport': mockserialport,
    'xbee-api': mockXbeeApi
});

describe('xbee-promise', function () {

    describe('close', function () {

        var xbee;

        beforeEach(function () {
            xbee = xbeePromise({
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
