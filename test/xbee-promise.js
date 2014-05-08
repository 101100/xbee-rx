/*jslint node:true */
/*global describe:false, it:false */

/*
 * test/xbee-promise.js
 * https://github.com/101100/xbee-promise
 *
 * Tests for the xbee-promise library.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var should = require("should");
var proxyquire = require('proxyquire');
var mockserialport = require('./mock-serialport.js');

var xbeePromise = proxyquire("../lib/xbee-promise.js", { 'serialport': mockserialport });

describe('xbee-promise', function () {

    describe('constructor', function () {

        function callConstructor(params) {
            return function () {
                xbeePromise(params);
            };
        }

        it("fails with non-object options parameter", function () {

            var badParam,
                badParams = [ undefined, null, "string", true, 42 ];

            for (badParam in badParams) {
                if (badParams.hasOwnProperty(badParam)) {
                    callConstructor(badParam).should.throw();
                }
            }

        });

        it("fails with missing 'serialport' options parameter", function () {

            var badParam,
                badParams = [ {}, { test: "fail!" } ];

            for (badParam in badParams) {
                if (badParams.hasOwnProperty(badParam)) {
                    callConstructor(badParam).should.throw();
                }
            }

        });

        it("fails with incorrect 'module' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                module: "JiffyCorp"
            }).should.throw();

        });

        it("fails with incorrect 'api_mode' options parameter", function () {

            callConstructor({
                serialport: "serialport path",
                api_mode: 3
            }).should.throw();

        });

        it("fails with non-object 'serialportOptions' options parameter", function () {

            var badParam,
                badParams = [
                    {
                        serialport: "serialport path",
                        serialportOptions: "string"
                    },
                    {
                        serialport: "serialport path",
                        serialportOptions: true
                    },
                    {
                        serialport: "serialport path",
                        serialportOptions: 81
                    }
                ];

            for (badParam in badParams) {
                if (badParams.hasOwnProperty(badParam)) {
                    callConstructor(badParam).should.throw();
                }
            }

        });

        it("passes 'serialport' path to serialport", function () {

            var serialport = "fake serialport path",
                xbee;

            xbee = xbeePromise({ serialport: serialport });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.path.should.equal(serialport);

        });

        it("passes parser to serialport", function () {

            var serialport = "fake serialport path",
                xbee;

            xbee = xbeePromise({ serialport: serialport });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.options.parser.should.be.type('function');

        });

        it("passes 'serialportOptions' + parser to serialport", function () {

            var serialport = "fake serialport path",
                serialportOptions = {
                    string: "never",
                    numeric: 42,
                    other: function () { return; }
                },
                xbee;

            xbee = xbeePromise({ serialport: serialport, serialportOptions: serialportOptions });
            xbee.should.be.type('object');
            mockserialport.opened.should.equal(true);
            mockserialport.options.parser.should.be.type('function');
            mockserialport.options.string.should.equal("never");
            mockserialport.options.numeric.should.equal(42);
            mockserialport.options.other.should.equal(serialportOptions.other);

        });

    });

});
