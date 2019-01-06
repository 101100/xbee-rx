/*jslint node:true, nomen:true */

/*
 * examples/shared.js
 * https://github.com/101100/xbee-rx
 *
 * Copyright (c) 2014-2016 Jason Heard
 * Licensed under the MIT license.
 */

"use strict";


function printResult(resultBuffer, prefix) {
    var resultAsInt,
        resultAsString;

    prefix = prefix || "";

    if (resultBuffer) {
        if (resultBuffer.length === 0) {
            console.log(prefix + "Result is empty");
        } else {
            console.log(prefix + "Result as hex:", resultBuffer.toString("hex"));
            resultAsString = resultBuffer.toString();
            if (resultAsString && !/[^\x20-\x7E]+/.test(resultAsString)) {
                console.log(prefix + "Result as string:", resultAsString);
            } else {
                if (resultBuffer.length === 1) {
                    resultAsInt = resultBuffer.readInt8(0);
                } else if (resultBuffer.length === 2) {
                    resultAsInt = resultBuffer.readInt16BE(0);
                } else if (resultBuffer.length === 4) {
                    resultAsInt = resultBuffer.readInt32BE(0);
                } else if (resultBuffer.length === 8) {
                    resultAsInt = (resultBuffer.readInt32BE(0) << 32) | resultBuffer.readInt32BE(4);
                } else {
                    console.log(prefix + "Got non-string buffer of unusual length:", resultBuffer.length);
                }
                if (typeof(resultAsInt) === "number") {
                    console.log(prefix + "Result as integer:", resultAsInt);
                }
            }
        }
    } else {
        console.log(prefix + "No result buffer");
    }
}


module.exports = {
    printResult: printResult
};
