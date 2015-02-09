var SimplePeer = require('simple-peer');

var peer1 = new SimplePeer({
        initiator: true
});

var peer2 = new SimplePeer();

peer1.on('signal', function(data) {
        // when peer1 has signaling data, give it to peer2 
        peer2.signal(data)
});

peer2.on('signal', function(data) {
        // same as above, but in reverse 
        peer1.signal(data)
});

peer1.on('connect', function() {
        // wait for 'connect' event before using the data channel 
        peer1.send('hey peer2, how is it going?')
});

peer2.on('data', function(data) {
        // got a data channel message 
        console.log('got a message from peer1: ' + data)
});