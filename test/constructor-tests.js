/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/constructor-tests.js
 * https://github.com/101100/xbee-rx
 *
 * Tests for the xbee-rx library constructor.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var should = require("should");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeeRx = proxyquire("../lib/xbee-rx.js", {
    'serialport': mockserialport.MockSerialPort,
    'xbee-api': mockXbeeApi
});

describe('xbee-rx', function () {

    describe('constructor', function () {

        function callConstructor(params) {
            return function () {
                xbeeRx(params);
            };
        }

        it("fails with non-object options parameter", function () {

            var badOptions = [ undefined, null, "string", true, 42 ];

            badOptions.forEach(function (options) {
                callConstructor(options).should.throw(/property 'serialport' is missing/);
            });

        });

        it("fails with missing 'serialport' options parameter", function () {

            var badOptions = [ {}, { test: "fail!" } ];

            badOptions.forEach(function (options) {
                callConstructor(options).should.throw(/property 'serialport' is missing/);
            });

        });

        it("fails with missing 'module' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                a: 'a'
            }).should.throw(/property 'module' is missing/);

        });

        it("fails with incorrect 'module' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                module: "JiffyCorp"
            }).should.throw(/must be one of '802\.15\.4,ZNet,ZigBee'/);

        });

        it("fails with incorrect 'api_mode' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                module: "ZigBee",
                api_mode: 3
            }).should.throw(/must be one of '1,2'/);

        });

        it("fails with invalid 'defaultTimeoutMs' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                module: "ZigBee",
                defaultTimeoutMs: "two minutes"
            }).should.throw(/not of type 'integer'/);

            callConstructor({
                serialport: "serialport path",
                module: "ZigBee",
                defaultTimeoutMs: -12
            }).should.throw(/not greater than or equal with '10'/);

        });

        it("fails with non-object 'serialportOptions' options parameter", function () {

            var badOptions = [
                    {
                        serialport: "serialport path",
                        module: "ZigBee",
                        serialportOptions: "string"
                    },
                    {
                        serialport: "serialport path",
                        module: "ZigBee",
                        serialportOptions: true
                    },
                    {
                        serialport: "serialport path",
                        module: "ZigBee",
                        serialportOptions: 81
                    }
                ];

            badOptions.forEach(function (options) {
                callConstructor(options).should.throw(/property 'serialportOptions'.*must be a object/);
            });

        });

        it("passes 'serialport' path to serialport", function () {

            var serialport = "fake serialport path",
                xbee;

            xbee = xbeeRx({ serialport: serialport, module: "ZigBee" });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.path.should.equal(serialport);

        });

        it("passes parser to serialport", function () {

            var serialport = "fake serialport path",
                xbee;

            xbee = xbeeRx({ serialport: serialport, module: "ZigBee" });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.options.should.be.type('object');
            mockserialport.options.should.have.property("parser", mockXbeeApi.fauxParser);

        });

        it("passes 'serialportOptions' + parser to serialport", function () {

            var serialport = "fake serialport path",
                serialportOptions = {
                    string: "never",
                    numeric: 42,
                    other: function () { return; }
                },
                xbee;

            xbee = xbeeRx({ serialport: serialport, module: "ZigBee", serialportOptions: serialportOptions });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.options.should.be.type('object');
            mockserialport.options.should.have.property("parser", mockXbeeApi.fauxParser);
            mockserialport.options.should.have.property("string", "never");
            mockserialport.options.should.have.property("numeric", 42);
            mockserialport.options.should.have.property("other", serialportOptions.other);

        });

    });

});
