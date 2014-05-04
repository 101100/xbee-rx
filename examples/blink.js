var xbee = require('../lib/xbee-promise.js');

var onNext = true;
var nodeId = 'TEMP3';

console.log('Blinking LED on AD1 on module with ID: ', nodeId);

var interval = setInterval(function () {
    xbee.remoteCommand({
        command: "D1",
        commandParameter: [ onNext ? 5 : 4 ],
        destinationId: nodeId
    }).catch(function(e) {
        console.log("Command failed:", e);
        clearInterval(interval);
        xbee.close();
    });
    console.log(onNext ? 'ON' : 'OFF');

    onNext = !onNext;
}, 2000);

