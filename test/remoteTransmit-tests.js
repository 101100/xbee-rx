/*jslint node:true, regexp: true */
/*global describe:false, it:false, beforeEach:false */

/*
 * test/remoteTransmit-tests.js
 * https://github.com/101100/xbee-promise
 *
 * Tests for the xbee-promise library remoteTransmit function.
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

            describe('remoteTransmit', function () {

                var xbee;

                beforeEach(function () {
                    xbee = xbeePromise({
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
                        callRemoteTransmit(settings).should.throw(/one of these properties must be used: 'destinationId,destination64,destination16'/);
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
                                destinationId: ['array', 'no', 'good!']
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
                        destination64: '0102030405060708',
                        timeoutMs: 'not too long'
                    }).should.throw(/not of type 'integer'/);

                    callRemoteTransmit({
                        data: "Test data",
                        destination64: '0102030405060708',
                        timeoutMs: -12
                    }).should.throw(/not greater than or equal with '10'/);

                });

                describe("using destination64", function () {

                    var data = "Data to send",
                        destination64 = "0102030405060708",
                        commandPromise;

                    beforeEach(function () {

                        commandPromise = xbee.remoteTransmit({
                            data: data,
                            destination64: destination64
                        });

                    });

                    it("returns a promise", function () {

                        Q.isPromise(commandPromise).should.equal(true);

                    });

                    it("sends correct frame", function () {

                        mockserialport.lastWrite.should.be.type('object');
                        mockserialport.lastWrite.should.have.property('built', true);
                        mockserialport.lastWrite.should.have.property('type', module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_REQUEST_64 : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                        mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property('data', data);
                        mockserialport.lastWrite.should.have.property('destination64', destination64);
                        mockserialport.lastWrite.should.have.property('destination16', undefined);

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

                        it("resolves promise with 'true'", function (done) {

                            commandPromise.then(function (result) {
                                result.should.equal(true);
                                done();
                            }).catch(function (result) {
                                throw result;
                            }).done();

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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS : mockXbeeApi.constants.FRAME_TYPE.TX_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 0,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 0,
                                deliveryStatus: 2,
                                discoveryStatus: 0
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

                describe("using destination16", function () {

                    var data = "Other data",
                        destination16 = [ 1, 2 ],
                        commandPromise;

                    beforeEach(function () {

                        commandPromise = xbee.remoteTransmit({
                            data: data,
                            destination16: destination16
                        });

                    });

                    it("returns a promise", function () {

                        Q.isPromise(commandPromise).should.equal(true);

                    });

                    it("sends correct frame", function () {

                        mockserialport.lastWrite.should.be.type('object');
                        mockserialport.lastWrite.should.have.property('built', true);
                        mockserialport.lastWrite.should.have.property('type', module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_REQUEST_16 : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                        mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                        mockserialport.lastWrite.should.have.property('data', data);
                        mockserialport.lastWrite.should.have.property('destination64', undefined);
                        mockserialport.lastWrite.should.have.property('destination16', destination16);

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

                        it("resolves promise with 'true'", function (done) {

                            commandPromise.then(function (result) {
                                result.should.equal(true);
                                done();
                            }).catch(function (result) {
                                throw result;
                            }).done();

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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS : mockXbeeApi.constants.FRAME_TYPE.TX_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 12,
                                deliveryStatus: 0,
                                discoveryStatus: 0
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
                                type: module === "802.15.4" ? mockXbeeApi.constants.FRAME_TYPE.TX_STATUS : mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS,
                                id: mockXbeeApi.lastFrameId,
                                transmitRetryCount: 12,
                                deliveryStatus: 1,
                                discoveryStatus: 0
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

                if (module !== "802.15.4") {

                    describe("using destinationId", function () {

                        var data = "Message thingy...",
                            destinationId = "TESTNODE",
                            commandPromise;

                        beforeEach(function () {

                            commandPromise = xbee.remoteTransmit({
                                data: data,
                                destinationId: destinationId
                            });

                        });

                        it("returns a promise", function () {

                            Q.isPromise(commandPromise).should.equal(true);

                        });

                        it("sends lookup frame", function () {

                            mockserialport.lastWrite.should.be.type('object');
                            mockserialport.lastWrite.should.have.property('built', true);
                            mockserialport.lastWrite.should.have.property('type', mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND);
                            mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                            mockserialport.lastWrite.should.have.property('command', "DN");
                            mockserialport.lastWrite.should.have.property('commandParameter', destinationId);

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

                            it("sends remote command frame", function (done) {

                                // need delay due to use of async then in library
                                setImmediate(function () {
                                    mockserialport.lastWrite.should.be.type('object');
                                    mockserialport.lastWrite.should.have.property('built', true);
                                    mockserialport.lastWrite.should.have.property('type', mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                                    mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                                    mockserialport.lastWrite.should.have.property('data', data);
                                    mockserialport.lastWrite.should.have.property('destination64', [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                    mockserialport.lastWrite.should.have.property('destination16', undefined);

                                    done();
                                });

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

                                it("resolves promise with 'true'", function (done) {

                                    commandPromise.then(function (result) {
                                        result.should.equal(true);
                                        done();
                                    }).catch(function (result) {
                                        throw result;
                                    }).done();

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

                                it("rejects promise with Error", function (done) {

                                    commandPromise.catch(function (result) {
                                        result.should.be.instanceof(Error);
                                        result.message.should.be.type("string");
                                        done();
                                    }).done();

                                });

                            });

                            describe("with no remote command response frame", function () {

                                it("rejects promise with Error", function (done) {

                                    commandPromise.catch(function (result) {
                                        result.should.be.instanceof(Error);
                                        result.message.should.match(/Timed out after 100 ms/);
                                        done();
                                    }).done();

                                });

                            });

                            describe("with second command to same node", function () {

                                var data2 = "Another message...";

                                beforeEach(function () {

                                    xbee.remoteTransmit({
                                        data: data2,
                                        destinationId: destinationId
                                    });

                                });

                                it("sends remote command frame", function (done) {

                                    // need delay due to use of async then in library
                                    setImmediate(function () {
                                        mockserialport.lastWrite.should.be.type('object');
                                        mockserialport.lastWrite.should.have.property('built', true);
                                        mockserialport.lastWrite.should.have.property('type', mockXbeeApi.constants.FRAME_TYPE.ZIGBEE_TRANSMIT_REQUEST);
                                        mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                                        mockserialport.lastWrite.should.have.property('data', data2);
                                        mockserialport.lastWrite.should.have.property('destination64', [ 3, 4, 5, 6, 7, 8, 9, 10 ]);
                                        mockserialport.lastWrite.should.have.property('destination16', undefined);

                                        done();
                                    });

                                });

                            });

                            describe("with second command to new node", function () {

                                var destinationId2 = "OTHERNODE";

                                beforeEach(function () {

                                    xbee.remoteTransmit({
                                        data: data,
                                        destinationId: destinationId2
                                    });

                                });

                                it("sends lookup frame", function (done) {

                                    // need delay due to use of async then in library
                                    setImmediate(function () {
                                        mockserialport.lastWrite.should.be.type('object');
                                        mockserialport.lastWrite.should.have.property('built', true);
                                        mockserialport.lastWrite.should.have.property('type', mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND);
                                        mockserialport.lastWrite.should.have.property('id', mockXbeeApi.lastFrameId);
                                        mockserialport.lastWrite.should.have.property('command', "DN");
                                        mockserialport.lastWrite.should.have.property('commandParameter', destinationId2);

                                        done();
                                    });

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

                        describe("with non-matching lookup response frame (wrong type)", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: 0,
                                    commandData: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 ]
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

                        describe("with failure lookup response frame", function () {

                            beforeEach(function () {

                                mockXbeeApi.emitFrame({
                                    type: mockXbeeApi.constants.FRAME_TYPE.AT_COMMAND_RESPONSE,
                                    id: mockXbeeApi.lastFrameId,
                                    commandStatus: 1,
                                    commandData: [ ]
                                });

                            });

                            it("rejects promise with 'not found' Error", function (done) {

                                commandPromise.catch(function (result) {
                                    result.should.be.instanceof(Error);
                                    result.message.should.equal("Node not found");
                                    done();
                                }).done();

                            });

                        });

                        describe("with no lookup response frame", function () {

                            it("rejects promise with 'not found' Error", function (done) {

                                commandPromise.catch(function (result) {
                                    result.should.be.instanceof(Error);
                                    result.message.should.equal("Node not found");
                                    done();
                                }).done();

                            });

                        });

                    });

                }

            });

        });

    });

});
