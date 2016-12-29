/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/remoteCommand-tests.js
 * https://github.com/101100/xbee-rx
 *
 * Tests for the xbee-rx library remoteCommand function.
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var assert = require("assert");
require("should");

var proxyquire = require("proxyquire");
var mockserialport = require("./mock-serialport.js");
var mockXbeeApi = require("./mock-xbee-api.js");

var xbeeRx = proxyquire("../lib/xbee-rx.js", {
    "serialport": mockserialport.MockSerialPort,
    "xbee-api": mockXbeeApi
});

describe("xbee-rx", function () {

    [ "802.15.4", "ZNet", "ZigBee" ].forEach(function (module) {

        describe("for module " + module, function () {

            describe("remoteCommand", function () {

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
                        return xbee.remoteCommand(params);
                    };
                }

                it("fails with non-object options parameter", function () {

                    var badSettings = [ undefined, null, "string", true, 42 ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/property 'command' is missing/);
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

                it("fails with invalid 'command' options parameter", function () {

                    var badSettings = [
                            {
                                command: "TOO LONG",
                                destination16: "0102"
                            },
                            {
                                command: [ 0x67, 0x69 ],
                                destination64: "0102030405060708",
                                test: "fail!"
                            },
                            {
                                command: {},
                                destinationId: "NODE",
                                other: "stuff"
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/'command'.*must be a string/);
                    });

                });

                it("fails with no destination options parameter", function () {

                    var badSettings = [
                            {
                                command: "MY"
                            },
                            {
                                command: "D1",
                                commandParameter: [ 5 ]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/'destination16', 'destination64', or 'broadcast = true' must be specified./);
                    });

                });

                it("fails with 'destination64' options parameter of wrong type", function () {

                    var badSettings = [
                            {
                                command: "MY",
                                destination64: {}
                            },
                            {
                                command: "MY",
                                destination64: 42
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/is not of type 'string,array'/);
                    });

                });

                it("fails with bad 'destination64' options parameter", function () {

                    var badSettings = [
                            {
                                command: "MY",
                                destination64: "0102"
                            },
                            {
                                command: "MY",
                                destination64: "not hex but 16 !"
                            },
                            {
                                command: "MY",
                                destination64: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
                            },
                            {
                                command: "MY",
                                destination64: [ "not", "bytes", 3, 4, 5, 6, 7, 8 ]
                            },
                            {
                                command: "MY",
                                destination64: [ 256, 2, 3, 4, 5, 6, 7, 8 ]
                            },
                            {
                                command: "MY",
                                destination64: [ -1, 2, 3, 4, 5, 6, 7, 8 ]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/'destination64'.* must be a hex string of length 16 or a byte array of length 8/);
                    });

                });

                it("fails with 'destination16' options parameter of wrong type", function () {

                    var badSettings = [
                            {
                                command: "MY",
                                destination16: {}
                            },
                            {
                                command: "MY",
                                destination16: 42
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/is not of type 'string,array'/);
                    });

                });

                it("fails with bad 'destination16' options parameter", function () {

                    var badSettings = [
                            {
                                command: "MY",
                                destination16: "01020304"
                            },
                            {
                                command: "MY",
                                destination16: "nohx"
                            },
                            {
                                command: "MY",
                                destination16: [ 1 ]
                            },
                            {
                                command: "MY",
                                destination16: [ "not", "bytes" ]
                            },
                            {
                                command: "MY",
                                destination16: [ 256, 2 ]
                            },
                            {
                                command: "MY",
                                destination16: [ -1, 2, 3, 4, 5, 6, 7, 8 ]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/'destination16'.* must be a hex string of length 4 or a byte array of length 2/);
                    });

                });

                it("fails with invalid 'destinationId' parameter", function () {

                    var badSettings = [
                            {
                                command: "MY",
                                destinationId: {}
                            },
                            {
                                command: "MY",
                                destinationId: 42
                            },
                            {
                                command: "MY",
                                destinationId: ["array", "no", "good!"]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteCommand(settings).should.throw(/is not of type 'string'/);
                    });

                });

                if (module === "802.15.4") {

                    it("fails with 'destinationId' parameter", function () {

                        callRemoteCommand({
                            command: "MY",
                            destinationId: "Bob"
                        }).should.throw(/'destinationId' is not supported by 802.15.4 modules/);

                    });

                }

                it("fails with invalid 'timeoutMs' parameter", function () {

                    callRemoteCommand({
                        command: "MY",
                        destination64: "0102030405060708",
                        timeoutMs: "not too long"
                    }).should.throw(/not of type 'integer'/);

                    callRemoteCommand({
                        command: "MY",
                        destination64: "0102030405060708",
                        timeoutMs: -12
                    }).should.throw(/not greater than or equal with '10'/);

                });

                describe("using destination64", function () {

                    var command = "MY",
                        destination64 = "0102030405060708",
                        commandResultStream;

                    beforeEach(function () {

                        commandResultStream = xbee.remoteCommand({
                            destination64: destination64,
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

                        mockserialport.lastWrite.should.be.type("object");
                        mockserialport.lastWrite.should.have.property("built", true);
                        mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST);
                        mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property("command", command);
                        mockserialport.lastWrite.should.have.property("commandParameter", []);
                        mockserialport.lastWrite.should.have.property("destination64", destination64);
                        mockserialport.lastWrite.should.have.property("destination16", undefined);

                    });

                    describe("with success response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: mockXbeeApi.constants.COMMAND_STATUS.OK,
                                commandData: [ 42, 16 ]
                            });

                        });

                        it("emits whole packet", function (done) {

                            commandResultStream
                                .subscribe(function (result) {
                                    result.should.be.type("object");
                                    result.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE);
                                    result.should.have.property("commandStatus", mockXbeeApi.constants.COMMAND_STATUS.OK);
                                    result.should.have.property("commandData", [ 42, 16 ]);
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
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId + 42,
                                commandStatus: 0,
                                commandData: [ 42, 16 ]
                            });

                        });

                        it("does not emit data, complete or error", function (done) {

                            var subscription;

                            setTimeout(function () {
                                subscription.dispose();
                                done();
                            }, 50);

                            subscription = commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    assert.fail("Stream ended with error");
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                    describe("with non-matching response frame (wrong type)", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: 0,
                                commandData: [ 42, 16 ]
                            });

                        });

                        it("does not emit data, complete or error", function (done) {

                            var subscription;

                            setTimeout(function () {
                                subscription.dispose();
                                done();
                            }, 50);

                            subscription = commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    assert.fail("Stream ended with error");
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                    describe("with transmit failure response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: mockXbeeApi.constants.COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE,
                                commandData: []
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
                                });

                        });

                    });

                });

                describe("using destination16", function () {

                    var command = "NI",
                        destination16 = [ 1, 2 ],
                        commandParameter = "NODELY",
                        commandResultStream;

                    beforeEach(function () {

                        commandResultStream = xbee.remoteCommand({
                            destination16: destination16,
                            command: command,
                            commandParameter: commandParameter
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

                        mockserialport.lastWrite.should.be.type("object");
                        mockserialport.lastWrite.should.have.property("built", true);
                        mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST);
                        mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property("command", command);
                        mockserialport.lastWrite.should.have.property("commandParameter", commandParameter);
                        mockserialport.lastWrite.should.have.property("destination64", undefined);
                        mockserialport.lastWrite.should.have.property("destination16", destination16);

                    });

                    describe("with success response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: mockXbeeApi.constants.COMMAND_STATUS.ERROR,
                                commandData: undefined
                            });

                        });

                        it("emits whole packet", function (done) {

                            commandResultStream
                                .subscribe(function (result) {
                                    result.should.be.type("object");
                                    result.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE);
                                    result.should.have.property("commandStatus", mockXbeeApi.constants.COMMAND_STATUS.ERROR);
                                    result.should.have.property("commandData", undefined);
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
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId + 42,
                                commandStatus: 0,
                                commandData: []
                            });

                        });

                        it("does not emit data, complete or error", function (done) {

                            var subscription;

                            setTimeout(function () {
                                subscription.dispose();
                                done();
                            }, 50);

                            subscription = commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    assert.fail("Stream ended with error");
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                    describe("with non-matching response frame (wrong type)", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: 0,
                                commandData: []
                            });

                        });

                        it("does not emit data, complete or error", function (done) {

                            var subscription;

                            setTimeout(function () {
                                subscription.dispose();
                                done();
                            }, 50);

                            subscription = commandResultStream
                                .subscribe(function () {
                                    assert.fail("Stream contained data");
                                }, function () {
                                    assert.fail("Stream ended with error");
                                }, function () {
                                    assert.fail("Stream completed");
                                });

                        });

                    });

                    describe("with transmit failure response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                id: mockXbeeApi.lastFrameId,
                                commandStatus: mockXbeeApi.constants.COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE,
                                commandData: []
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
                                });

                        });

                    });

                });

                if (module !== "802.15.4") {

                    describe("using destinationId", function () {

                        var command = "SH",
                            destinationId = "TESTNODE",
                            commandResultStream;

                        beforeEach(function () {

                            commandResultStream = xbee.remoteCommand({
                                destinationId: destinationId,
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

                        it("sends lookup frame", function () {

                            mockserialport.lastWrite.should.be.type("object");
                            mockserialport.lastWrite.should.have.property("built", true);
                            mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND);
                            mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                            mockserialport.lastWrite.should.have.property("command", "DN");
                            mockserialport.lastWrite.should.have.property("commandParameter", destinationId);

                        });

                        describe("with lookup success response frame", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: 0,
                                    commandData: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
                                });

                            });

                            it("sends remote command frame", function () {

                                mockserialport.lastWrite.should.be.type("object");
                                mockserialport.lastWrite.should.have.property("built", true);
                                mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST);
                                mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                                mockserialport.lastWrite.should.have.property("command", command);
                                mockserialport.lastWrite.should.have.property("commandParameter", []);
                                mockserialport.lastWrite.should.have.property("destination64", [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                mockserialport.lastWrite.should.have.property("destination16", undefined);

                            });

                            describe("with remote command success response frame", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                        id: mockXbeeApi.lastFrameId,
                                        commandStatus: 42,
                                        commandData: [ 1, 2, 3, 4 ]
                                    });

                                });

                                it("emits whole packet", function (done) {

                                    commandResultStream
                                        .subscribe(function (result) {
                                            result.should.be.type("object");
                                            result.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE);
                                            result.should.have.property("commandStatus", 42);
                                            result.should.have.property("commandData", [ 1, 2, 3, 4 ]);
                                        }, function () {
                                            assert.fail("Stream ended with error");
                                        }, function () {
                                            done();
                                        });

                                });

                            });

                            describe("with non-matching remote command response frame (wrong id)", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                        id: mockXbeeApi.lastFrameId + 42,
                                        commandStatus: 0,
                                        commandData: [ 1, 2, 3, 4 ]
                                    });

                                });

                                it("does not emit data, complete or error", function (done) {

                                    var subscription;

                                    setTimeout(function () {
                                        subscription.dispose();
                                        done();
                                    }, 50);

                                    subscription = commandResultStream
                                        .subscribe(function () {
                                            assert.fail("Stream contained data");
                                        }, function () {
                                            assert.fail("Stream ended with error");
                                        }, function () {
                                            assert.fail("Stream completed");
                                        });

                                });

                            });

                            describe("with non-matching remote command response frame (wrong type)", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                        id: mockXbeeApi.lastFrameId,
                                        commandStatus: 0,
                                        commandData: [ 1, 2, 3, 4 ]
                                    });

                                });

                                it("does not emit data, complete or error", function (done) {

                                    var subscription;

                                    setTimeout(function () {
                                        subscription.dispose();
                                        done();
                                    }, 50);

                                    subscription = commandResultStream
                                        .subscribe(function () {
                                            assert.fail("Stream contained data");
                                        }, function () {
                                            assert.fail("Stream ended with error");
                                        }, function () {
                                            assert.fail("Stream completed");
                                        });

                                });

                            });

                            describe("with transmit failure remote command response frame", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                        id: mockXbeeApi.lastFrameId,
                                        commandStatus: mockXbeeApi.constants.COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE,
                                        commandData: [ 1, 2, 3, 4 ]
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
                                        });

                                });

                            });

                            describe("with no remote command response frame", function () {

                                it("ends stream with error", function (done) {

                                    commandResultStream
                                        .subscribe(function () {
                                            assert.fail("Stream contained data");
                                        }, function (result) {
                                            result.should.be.instanceof(Error);
                                            result.message.should.match(/Timed out after 100 ms/);
                                            done();
                                        });

                                });

                            });

                            describe("with second command to same node", function () {

                                var command2 = "SL";

                                beforeEach(function () {

                                    var secondCommandStream = xbee.remoteCommand({
                                        destinationId: destinationId,
                                        command: command2
                                    }).publishLast();

                                    secondCommandStream.connect();

                                });

                                it("sends remote command frame", function () {

                                    mockserialport.lastWrite.should.be.type("object");
                                    mockserialport.lastWrite.should.have.property("built", true);
                                    mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.REMOTE_AT_COMMAND_REQUEST);
                                    mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                                    mockserialport.lastWrite.should.have.property("command", command2);
                                    mockserialport.lastWrite.should.have.property("commandParameter", []);
                                    mockserialport.lastWrite.should.have.property("destination64", [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                    mockserialport.lastWrite.should.have.property("destination16", undefined);

                                });

                            });

                            describe("with second command to new node", function () {

                                var destinationId2 = "OTHERNODE";

                                beforeEach(function () {

                                    var secondCommandStream = xbee.remoteCommand({
                                        destinationId: destinationId2,
                                        command: command
                                    }).publishLast();

                                    secondCommandStream.connect();

                                });

                                it("sends lookup frame", function () {

                                    mockserialport.lastWrite.should.be.type("object");
                                    mockserialport.lastWrite.should.have.property("built", true);
                                    mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND);
                                    mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                                    mockserialport.lastWrite.should.have.property("command", "DN");
                                    mockserialport.lastWrite.should.have.property("commandParameter", destinationId2);

                                });

                            });

                        });

                        describe("with non-matching lookup response frame (wrong id)", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId + 42,
                                    commandStatus: 0,
                                    commandData: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
                                });

                            });

                            it("does not emit data, complete or error", function (done) {

                                var subscription;

                                setTimeout(function () {
                                    subscription.dispose();
                                    done();
                                }, 50);

                                subscription = commandResultStream
                                    .subscribe(function () {
                                        assert.fail("Stream contained data");
                                    }, function () {
                                        assert.fail("Stream ended with error");
                                    }, function () {
                                        assert.fail("Stream completed");
                                    });

                            });

                        });

                        describe("with non-matching lookup response frame (wrong type)", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: 0,
                                    commandData: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
                                });

                            });

                            it("does not emit data, complete or error", function (done) {

                                var subscription;

                                setTimeout(function () {
                                    subscription.dispose();
                                    done();
                                }, 50);

                                subscription = commandResultStream
                                    .subscribe(function () {
                                        assert.fail("Stream contained data");
                                    }, function () {
                                        assert.fail("Stream ended with error");
                                    }, function () {
                                        assert.fail("Stream completed");
                                    });

                            });

                        });

                        describe("with transmit failure lookup response frame", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: mockXbeeApi.constants.COMMAND_STATUS.REMOTE_CMD_TRANS_FAILURE,
                                    commandData: [ ]
                                });

                            });

                            it("ends stream with 'not found' error", function (done) {

                                commandResultStream
                                    .subscribe(function () {
                                        assert.fail("Stream contained data");
                                    }, function (result) {
                                        result.should.be.instanceof(Error);
                                        result.message.should.equal("Node not found");
                                        done();
                                    });

                            });

                        });

                        describe("with no lookup response frame", function () {

                            it("ends stream with 'not found' error", function (done) {

                                commandResultStream
                                    .subscribe(function () {
                                        assert.fail("Stream contained data");
                                    }, function (result) {
                                        result.should.be.instanceof(Error);
                                        result.message.should.equal("Node not found");
                                        done();
                                    });

                            });

                        });

                    });

                }

            });

        });

    });

});
