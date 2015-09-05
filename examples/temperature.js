/*jslint node:true */

/*
 * examples/temperature.js
 * https://github.com/101100/xbee-rx
 *
 * Example showing the use of monitorIODataPackets and some fun RxJS stream
 * manipulation.
 *
 * This requires that you have a node set up to send IO samples about once a second
 * and that a TMP36 is hooked up to the AD0 pin and included in the sample.  This
 * program will average 10 seconds of samples and print them if at least a minute
 * has gone by or the temperature changes.
 *
 * Copyright (c) 2014 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var moment = require('moment');
var R = require('ramda');
var rx = require('rx');
var xbeeRx = require('../lib/xbee-rx.js');

var xbee = xbeeRx({
    serialport: '/dev/ttyUSB0',
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

var lastValue = undefined;
var lastMoment = undefined;

xbee
    .monitorIODataPackets()
    .pluck("analogSamples")
    .pluck("AD0") // extract just the AD0 sample (in millivolts)
    .map(function (mv) { return (mv - 500) / 10; }) // convert millivolts to Centigrade
    .buffer(function () { return rx.Observable.timer(10000); }) // collect 10 seconds of packets
    .map(R.mean) // compute the mean of the collected samples
    .where(function (value) {
        return value !== lastValue || moment().diff(lastMoment, 'minutes') > 1;
    })
    .do(function (value) {
        lastValue = value;
        lastMoment = moment();
    })
    .subscribe(function (value) {
        console.log(new Date(), "temperature:", value);
    }, function (error) {
        console.log("Error during monitoring:\n", error);
        xbee.close();
    }, function () {
        console.log("Monitoring stream ended; exiting.");
        xbee.close();
    });
