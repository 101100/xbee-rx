/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/remoteTransmit-tests.js
 * https://github.com/101100/xbee-rx
 *
 * Tests for the xbee-rx library remoteTransmit function.
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

            describe("remoteTransmit", function () {

                var xbee;

                beforeEach(function () {
                    xbee = xbeeRx({
                        serialport: "serialport path",
                        module: module,
                        defaultTimeoutMs: 100
                    });
                });

                function callRemoteTransmit(params) {
                    return function () {
                        return xbee.remoteTransmit(params);
                    };
                }

                it("fails with non-object options parameter", function () {

                    var badSettings = [ undefined, null, "string", true, 42 ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/property 'data' is missing/);
                    });

                });

                it("fails with missing 'data' options parameter", function () {

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
                        callRemoteTransmit(settings).should.throw(/property 'data' is missing/);
                    });

                });

                it("fails with no destination options parameter", function () {

                    var badSettings = [
                            {
                                data: "Test data"
                            },
                            {
                                data: "Stuff to send..."
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/'destination16', 'destination64', or 'broadcast = true' must be specified./);
                    });

                });

                it("fails with 'destination64' options parameter of wrong type", function () {

                    var badSettings = [
                            {
                                data: "Test data",
                                destination64: {}
                            },
                            {
                                data: "Test data",
                                destination64: 42
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/is not of type 'string,array'/);
                    });

                });

                it("fails with bad 'destination64' options parameter", function () {

                    var badSettings = [
                            {
                                data: "Test data",
                                destination64: "0102"
                            },
                            {
                                data: "Test data",
                                destination64: "not hex but 16 !"
                            },
                            {
                                data: "Test data",
                                destination64: [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
                            },
                            {
                                data: "Test data",
                                destination64: [ "not", "bytes", 3, 4, 5, 6, 7, 8 ]
                            },
                            {
                                data: "Test data",
                                destination64: [ 256, 2, 3, 4, 5, 6, 7, 8 ]
                            },
                            {
                                data: "Test data",
                                destination64: [ -1, 2, 3, 4, 5, 6, 7, 8 ]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/'destination64'.* must be a hex string of length 16 or a byte array of length 8/);
                    });

                });

                it("fails with 'destination16' options parameter of wrong type", function () {

                    var badSettings = [
                            {
                                data: "Test data",
                                destination16: {}
                            },
                            {
                                data: "Test data",
                                destination16: 42
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/is not of type 'string,array'/);
                    });

                });

                it("fails with bad 'destination16' options parameter", function () {

                    var badSettings = [
                            {
                                data: "Test data",
                                destination16: "01020304"
                            },
                            {
                                data: "Test data",
                                destination16: "nohx"
                            },
                            {
                                data: "Test data",
                                destination16: [ 1 ]
                            },
                            {
                                data: "Test data",
                                destination16: [ "not", "bytes" ]
                            },
                            {
                                data: "Test data",
                                destination16: [ 256, 2 ]
                            },
                            {
                                data: "Test data",
                                destination16: [ -1, 2, 3, 4, 5, 6, 7, 8 ]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/'destination16'.* must be a hex string of length 4 or a byte array of length 2/);
                    });

                });

                it("fails with invalid 'destinationId' parameter", function () {

                    var badSettings = [
                            {
                                data: "Test data",
                                destinationId: {}
                            },
                            {
                                data: "Test data",
                                destinationId: 42
                            },
                            {
                                data: "Test data",
                                destinationId: ["array", "no", "good!"]
                            }
                        ];

                    badSettings.forEach(function (settings) {
                        callRemoteTransmit(settings).should.throw(/is not of type 'string'/);
                    });

                });

                if (module === "802.15.4") {

                    it("fails with 'destinationId' parameter", function () {

                        callRemoteTransmit({
                            data: "Test data",
                            destinationId: "Bob"
                        }).should.throw(/'destinationId' is not supported by 802.15.4 modules/);

                    });

                }

                it("fails with invalid 'timeoutMs' parameter", function () {

                    callRemoteTransmit({
                        data: "Test data",
                        destination64: "0102030405060708",
                        timeoutMs: "not too long"
                    }).should.throw(/not of type 'integer'/);

                    callRemoteTransmit({
                        data: "Test data",
                        destination64: "0102030405060708",
                        timeoutMs: -12
                    }).should.throw(/not greater than or equal with '10'/);

                });

                describe("using destination64", function () {

                    var data = "Data to send",
                        destination64 = "0102030405060708",
                        commandResultStream;

                    beforeEach(function () {

                        commandResultStream = xbee.remoteTransmit({
                            data: data,
                            destination64: destination64
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
                        mockserialport.lastWrite.should.have.property("type", module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_REQUEST_64 : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                        mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property("data", data);
                        mockserialport.lastWrite.should.have.property("destination64", destination64);
                        mockserialport.lastWrite.should.have.property("destination16", undefined);

                    });

                    describe("with success response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 0,
                                deliveryStatus: 0,
                                discoveryStatus: 0
                            });

                        });

                        it("emits 'true'", function (done) {

                            commandResultStream
                                .subscribe(function (result) {
                                    result.should.equal(true);
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId + 42,
                                transmitRetryCount: 0,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS : mockXbeeApi.constants.FRAME_TYPE.TX_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 0,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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

                    describe("with failure response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 0,
                                deliveryStatus: 2,
                                discoveryStatus: 0
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

                describe("using destination16", function () {

                    var data = "Other data",
                        destination16 = [ 1, 2 ],
                        commandResultStream;

                    beforeEach(function () {

                        commandResultStream = xbee.remoteTransmit({
                            data: data,
                            destination16: destination16
                        }).publishLast();

                        // connect to the command stream so that it will send
                        // packets immediately
                        commandResultStream.connect();

                    });

                    it("returns an Rx stream", function () {

                        //Q.isPromise(commandResultStream).should.equal(true);
                        return; //TODO

                    });

                    it("sends correct frame", function () {

                        mockserialport.lastWrite.should.be.type("object");
                        mockserialport.lastWrite.should.have.property("built", true);
                        mockserialport.lastWrite.should.have.property("type", module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_REQUEST_16 : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                        mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property("data", data);
                        mockserialport.lastWrite.should.have.property("destination64", undefined);
                        mockserialport.lastWrite.should.have.property("destination16", destination16);

                    });

                    describe("with success response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 12,
                                deliveryStatus: 0,
                                discoveryStatus: 0
                            });

                        });

                        it("emits 'true'", function (done) {

                            commandResultStream
                                .subscribe(function (result) {
                                    result.should.equal(true);
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId + 42,
                                transmitRetryCount: 12,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS : mockXbeeApi.constants.FRAME_TYPE.TX_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 12,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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

                    describe("with failure response frame", function () {

                        beforeEach(function () {

                            mockXbeeApi.emitFrame({
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 12,
                                deliveryStatus: 1,
                                discoveryStatus: 0
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

                if (module !== "802.15.4") {

                    describe("using destinationId", function () {

                        var data = "Message thingy...",
                            destinationId = "TESTNODE",
                            commandResultStream;

                        beforeEach(function () {

                            commandResultStream = xbee.remoteTransmit({
                                data: data,
                                destinationId: destinationId
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
                                mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                                mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                                mockserialport.lastWrite.should.have.property("data", data);
                                mockserialport.lastWrite.should.have.property("destination64", [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                mockserialport.lastWrite.should.have.property("destination16", undefined);

                            });

                            describe("with remote command success response frame", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                        id: mockXbeeApi.lastFrameId,
                                        transmitRetryCount: 9,
                                        deliveryStatus: 0,
                                        discoveryStatus: 0
                                    });

                                });

                                it("emits 'true'", function (done) {

                                    commandResultStream
                                        .subscribe(function (result) {
                                            result.should.equal(true);
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
                                        type: mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                        id: mockXbeeApi.lastFrameId + 42,
                                        transmitRetryCount: 9,
                                        deliveryStatus: 0,
                                        discoveryStatus: 0
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
                                        type: mockXbeeApi.constants.FRAME_TYPE.TX_STATUS,
                                        id: mockXbeeApi.lastFrameId,
                                        transmitRetryCount: 9,
                                        deliveryStatus: 0,
                                        discoveryStatus: 0
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

                            describe("with failure remote command response frame", function () {

                                beforeEach(function () {

                                    mockXbeeApi.emitFrame({
                                        type: mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                        id: mockXbeeApi.lastFrameId,
                                        transmitRetryCount: 9,
                                        deliveryStatus: 3,
                                        discoveryStatus: 0
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

                            describe("with no remote command response frame", function () {

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

                            describe("with second command to same node", function () {

                                var data2 = "Another message...";

                                beforeEach(function () {

                                    var secondCommandStream = xbee.remoteTransmit({
                                        data: data2,
                                        destinationId: destinationId
                                    }).publishLast();

                                    secondCommandStream.connect();

                                });

                                it("sends remote command frame", function () {

                                    mockserialport.lastWrite.should.be.type("object");
                                    mockserialport.lastWrite.should.have.property("built", true);
                                    mockserialport.lastWrite.should.have.property("type", mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                                    mockserialport.lastWrite.should.have.property("id", mockXbeeApi.lastFrameId);
                                    mockserialport.lastWrite.should.have.property("data", data2);
                                    mockserialport.lastWrite.should.have.property("destination64", [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                    mockserialport.lastWrite.should.have.property("destination16", undefined);

                                });

                            });

                            describe("with second command to new node", function () {

                                var destinationId2 = "OTHERNODE";

                                beforeEach(function () {

                                    var secondCommandStream = xbee.remoteTransmit({
                                        data: data,
                                        destinationId: destinationId2
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

                        describe("with failure lookup response frame", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: 1,
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
                                    }, function () {
                                        assert.fail("Stream completed");
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
                                    }, function () {
                                        assert.fail("Stream completed");
                                    });

                            });

                        });

                    });

                }

            });

        });

    });

});
