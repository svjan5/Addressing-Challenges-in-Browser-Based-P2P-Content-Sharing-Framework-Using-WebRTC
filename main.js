var node = require('./peer/peer.js');

var config = {
        // signalingURL: 'http://172.50.89.94:9000',
        signalingURL: 'http://localhost:9000',
        logging: true
};


peer = new node(config);

peer.events.on('registered', function(data) {
        console.log('registered with Id:', data.peerId);
});

peer.register();

setTimeout(function () {
	document.title = "Node: "+peer.peerId;
}, 1000);

setInterval(function(){ peer.nodeDetails.fixFingers(); }, 15000);