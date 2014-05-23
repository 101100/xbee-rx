/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/localCommand-tests.js
 * https://github.com/101100/xbee-promise
 *
 * Tests for the xbee-promise library localCommand function.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var assert = require("assert");
var should = require("should");
var Q = require("q");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeePromise = proxyquire("../lib/xbee-promise.js", {
    'serialport': mockserialport,
    'xbee-api': mockXbeeApi
});

describe('xbee-promise', function () {

    [ "802.15.4", "ZNet", "ZigBee" ].forEach(function (module) {

        describe("for module " + module, function () {

            describe('localCommand', function () {

                var xbee;

                beforeEach(function () {
                    xbee = xbeePromise({
                        serialport: "serialport path",
                        module: module,
                        defaultTimeoutMs: 100
                    });
                });

                function callRemoteCommand(params) {
                    return function () {
                        return xbee.localCommand(params);
                    };
                }

                it("fails with non-object options parameter", function () {

                    var badSettings = [ undefined, null, "string", true, 42 ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/property 'command' is missing/);
                    });

                });

                it("fails with invalid 'command' options parameter", function () {

                    var badSettings = [
                            {
                                command: "TOO LONG"
                            },
                            {
                                command: [ 0x67, 0x69 ],
                                test: "fail!"
                            },
                            {
                                command: {},
                                other: "stuff"
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/'command'.*must be a string/);
                    });

                });

                it("fails with missing 'command' options parameter", function () {

                    var badSettings = [
                            {
                                destination16: "0102"
                            },
                            {
                                destination64: "0102030405060708",
                                test: "fail!"
                            },
                            {
                                destinationId: "NODE",
                                other: "stuff"
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/property 'command' is missing/);
                    });

                });

                it("fails with invalid 'timeoutMs' parameter", function () {

                    callRemoteCommand({
                        command: "MY",
                        destination64: '0102030405060708',
                        timeoutMs: 'not too long'
                    }).should.throw(/not of type 'integer'/);

                    callRemoteCommand({
                        command: "MY",
                        destination64: '0102030405060708',
                        timeoutMs: -12
                    }).should.throw(/not greater than or equal with '10'/);

                });

                describe("with call", function () {

                    var command = "SL",
                        commandPromise;

                    beforeEach(function () {

                        commandPromise = xbee.localCommand({
                            command: command
                        });

                    });

                    it("returns a promise", function () {

                        Q.isPromise(commandPromise).should.equal(true);

                    });

                    it("sends correct frame", function () {

                        mockserialport.lastWrite.should.be.type('object');
                        mockserialport.lastWrite.should.have.property('built', true);
                        mockserialport.lastWrite.should.have.property('type', mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND);
                        mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property('command', command);
                        mockserialport.lastWrite.should.have.property('commandParameter', []);

                    });

                    describe("with success response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: 0,
                                commandData: [ 64, 159, 115, 3 ]
                            });

                        });

                        it("resolves promise with 'commandData'", function (done) {

                            commandPromise.then(function (result) {
                                result.should.eql([ 64, 159, 115, 3 ]);
                                done();
                            }).catch(function (result) {
                                throw result;
                            }).done();

                        });

                    });

                    describe("with non-matching response frame (wrong id)", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId + 42,
                                commandStatus: 0,
                                commandData: [ 64, 159, 115, 3 ]
                            });

                        });

                        it("does not resolve or reject promise", function (done) {

                            var areDone = false;

                            setTimeout(function () {
                                areDone = true;
                                done();
                            }, 50);

                            commandPromise.then(function () {
                                assert.fail("Promise was resolved");
                            }).catch(function () {
                                if (!areDone) {
                                    assert.fail("Promise was rejected early");
                                }
                            }).done();

                        });

                    });

                    describe("with non-matching response frame (wrong type)", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: 0,
                                commandData: [ 64, 159, 115, 3 ]
                            });

                        });

                        it("does not resolve or reject promise", function (done) {

                            var areDone = false;

                            setTimeout(function () {
                                areDone = true;
                                done();
                            }, 50);

                            commandPromise.then(function () {
                                assert.fail("Promise was resolved");
                            }).catch(function () {
                                if (!areDone) {
                                    assert.fail("Promise was rejected early");
                                }
                            }).done();

                        });

                    });

                    describe("with failure response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: 3,
                                commandData: [ ]
                            });

                        });

                        it("rejects promise with Error", function (done) {

                            commandPromise.catch(function (result) {
                                result.should.be.instanceof(Error);
                                result.message.should.be.type("string");
                                done();
                            }).done();

                        });

                    });

                    describe("with no response frame", function () {

                        it("rejects promise with Error", function (done) {

                            commandPromise.catch(function (result) {
                                result.should.be.instanceof(Error);
                                result.message.should.match(/Timed out after 100 ms/);
                                done();
                            }).done();

                        });

                    });

                });

            });

        });

    });

});
