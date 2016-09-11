/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/localCommand-tests.js
 * https://github.com/101100/xbee-rx
 *
 * Tests for the xbee-rx library localCommand function.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var assert = require("assert");
var should = require("should");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeeRx = proxyquire("../lib/xbee-rx.js", {
    'serialport': mockserialport.MockSerialPort,
    'xbee-api': mockXbeeApi
});

describe('xbee-rx', function () {

    [ "802.15.4", "ZNet", "ZigBee" ].forEach(function (module) {

        describe("for module " + module, function () {

            describe('localCommand', function () {

                var xbee;

                beforeEach(function () {
                    xbee = xbeeRx({
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
                        commandResultStream;

                    beforeEach(function () {

                        commandResultStream = xbee.localCommand({
                            command: command
                        }).publishLast();

                        // connect to the command stream so that it will send
                        // packets immediately
                        commandResultStream.connect();

                    });

                    it("returns an Rx stream", function () {

                        //Q.isPromise(commandResultStream).should.equal(true);
                        return; // TODO

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

                        it("emits 'commandData'", function (done) {

                            commandResultStream
                                .subscribe(function (result) {
                                    result.should.eql([ 64, 159, 115, 3 ]);
                                }, function () {
                                    assert.fail("Stream ended with error");
                                }, function () {
                                    done();
                                });

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

                        it("does not emit data, complete or error", function (done) {

                            var areDone = false;

                            setTimeout(function () {
                                areDone = true;
                                done();
                            }, 50);

                            commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    if (!areDone) {
                                        assert.fail("Stream ended with error early");
                                    }
                                }, function () {
                                    assert.fail("Stream completed");
                                });

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

                        it("does not emit data, complete or error", function (done) {

                            var areDone = false;

                            setTimeout(function () {
                                areDone = true;
                                done();
                            }, 50);

                            commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    if (!areDone) {
                                        assert.fail("Stream ended with error early");
                                    }
                                }, function () {
                                    assert.fail("Stream completed");
                                });

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

                        it("ends stream with error", function (done) {

                            commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function (result) {
                                    result.should.be.instanceof(Error);
                                    result.message.should.be.type("string");
                                    done();
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                    describe("with no response frame", function () {

                        it("ends stream with error", function (done) {

                            commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function (result) {
                                    result.should.be.instanceof(Error);
                                    result.message.should.match(/Timed out after 100 ms/);
                                    done();
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                });

            });

        });

    });

});

