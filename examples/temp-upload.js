/*jslint node:true */

/*
 * examples/temp-upload.js
 * https://github.com/101100/xbee-rx
 *
 * Example showing the use of monitorIODataPackets to monitor temperature IO
 * packets and upload them to Xively.
 *
 * This requires that you have a node set up to send IO samples about once a second
 * and that a TMP36 is hooked up to the AD0 pin and included in the sample.  This
 * program will average 10 seconds of samples and then upload a sample to a Xively
 * data stream.
 *
 * Copyright (c) 2015-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";

var querystring = require("querystring");
var R = require('ramda');
var rx = require("rx");
var request = require("request");
var xbeeRx = require('../lib/xbee-rx.js');

var requestPut = rx.Observable.fromNodeCallback(request.put);

// Creates a new observable that will make a HTTP or HTTPS
// POST request to the given url and will give the results
// as a single event in the stream.
function xivelyPost(feedId, streamId, apiKey, currentValue) {
    var dataPoint =
    {
        "version":"1.0.0",
        "datastreams" :
        [
            {
                "id" : streamId,
                "current_value" : currentValue
            },
        ]
    }

    var requestUrl = 'https://api.xively.com/v2/feeds/' + feedId;

    var options = { 
        url: requestUrl,
        headers: {
            "X-ApiKey" : apiKey,
            "Content-Type": "application/json",
            "Accept": "*/*",
            "User-Agent": "nodejs"
        },
        body: JSON.stringify(dataPoint)
    };

    return requestPut(options);
}

var xbee = xbeeRx({
    serialport: '/dev/ttyUSB0',
    serialportOptions: {
        baudrate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

// put in your API key and feed information here
var apiKey = "API-key (48 characters long)";
var feedId = "feed-id (9 digit number)";
var streamId = "stream-id (defined by you)";

xbee
    .monitorTransmissions()
    .pluck("analogSamples")
    .pluck("AD0")
    .map(function (mv) { return (mv - 500) / 10; })
    .buffer(function () { return rx.Observable.timer(60000); })
    .map(R.mean)
    .map(function (value) { return Math.round(value * 10) / 10; })
    .do(function (value) { console.log(new Date(), "temperature:", value); })
    .flatMap(function (value) {
        return xivelyPost(feedId, streamId, apiKey, value);
    })
    .pluck(0)
    .pluck("statusCode")
    .subscribe(function (x) {
        console.log("Sent data point; result code:", x);
    }, function (error) {
        console.log("Error during monitoring:\n", error);
        xbee.close();
    }, function () {
        console.log("Monitoring stream ended; exiting.");
        xbee.close();
    });

