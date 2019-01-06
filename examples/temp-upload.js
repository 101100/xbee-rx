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

var request = require("request");
var rx = require("rxjs");
rx.operators = require("rxjs/operators");

var xbeeRx = require("../lib/xbee-rx.js");


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
    };

    var requestUrl = "https://api.xively.com/v2/feeds/" + feedId;

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

function computeMean(samples) {
    if (samples.length === 0) {
        return 0;
    }

    return samples.reduce(function(a, b) { return a + b; }) / samples.length;
}

var xbee = xbeeRx({
    serialport: "/dev/ttyUSB0",
    serialportOptions: {
        baudRate: 57600
    },
    module: "ZigBee",
    // turn on debugging to see what the library is doing
    debug: false
});

// put in your API key and feed information here
var apiKey = "API-key (48 characters long)";
var feedId = "feed-id (9 digit number)";
var streamId = "stream-id (defined by you)";

var temperatureStream = xbee.monitorIODataPackets().pipe(
    rx.operators.pluck("analogSamples", "AD0"), // extract just the AD0 sample (in millivolts)
    rx.operators.map(function (mv) { return (mv - 500) / 10; }) // convert millivolts to Centigrade
);

var meanTemperatureStream = temperatureStream.pipe(
    rx.operators.bufferTime(60000), // collect 60 seconds of packets
    rx.operators.map(computeMean), // compute the mean of the collected samples
    rx.operators.map(function (value) { return Math.round(value * 10) / 10; }) // round to 1 decimal place
);

meanTemperatureStream.pipe(
    rx.operators.tap(function (value) { console.log(new Date(), "temperature:", value); }),
    rx.operators.flatMap(function (value) {
        return xivelyPost(feedId, streamId, apiKey, value);
    }),
    rx.operators.pluck(0),
    rx.operators.pluck("statusCode")
).subscribe(function (x) {
    console.log("Sent data point; result code:", x);
}, function (error) {
    console.log("Error during monitoring:\n", error);
    xbee.close();
}, function () {
    console.log("Monitoring stream ended; exiting.");
    xbee.close();
});
