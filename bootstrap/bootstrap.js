/*
LISTENED:
b-register      - register a node on the DHT, assign him uuid and inform that Node of his Id through p-registered
b-forward-offer - forward signaling data from one client that wants to connect to another client
b-offer-accepted- forward response signaling data

EMITTED:
p-finger-update - let a client know that he should update one of his fingers
p-predecessor   - let a client know of his predecessorId
p-forward-reply - Forward reply of Peer2 to Peer1
p-forward-offer - Forward offer of Peer1 to Peer2
p-registered    - tell a client he is registered and what is their Id
*/

var Hapi = require('hapi');
var io = require('socket.io');
var config = require('config');
// var Id = require('dht-id');
var randomPeers =       [18, 41, 26, 52, 0, 35, 40, 16, 60, 30, 31, 13, 2, 20, 34, 23, 14, 42, 
                        22, 46, 39, 36, 62, 17, 61, 54, 15, 4, 38, 58, 53, 21, 45, 1, 29, 24, 
                        44, 32, 50, 55, 43, 57, 28, 48, 25, 63, 47, 8, 7, 27, 49, 6, 33, 19, 
                        12, 5, 59, 3, 9, 56, 37, 51, 11, 10];
var counter = 0;

var peers = {}; 
// id : socket

// Console for server
var repl = require('repl');
var prompt = repl.start({
        prompt: 'server>'
});
prompt.context.listPeers = function() {return Object.keys(peers)};
prompt.context.peers = peers;

var server = new Hapi.Server(config.get('hapi.options'));

server.connection({
        port: config.get('hapi.port')
});

server.route({
        method: 'GET',
        path: '/',
        handler: function(request, reply) {
                reply('DTRM: Signaling Server');
        }
});

server.route({
        method: 'GET',
        path: '/dht',
        handler: function(request, reply) {
                reply(prompt.context.listPeers());
        }
});

server.start(started);

function started() {
        io.listen(server.listener).on('connection', mainServerFunction);
        console.log('Signaling server has started on:', server.info.uri);
}

console.log("\nStun server 1 address:"  + process.argv[2]);
console.log("Stun server 2 address:"  + process.argv[3]);
console.log("Strategy in Use:"  + process.argv[4]);
console.log("Doing Fixfigers: "  + (process.argv[5] == "fix"));
console.log("PostUrl: "  + process.argv[6]+":8000");

function mainServerFunction(socket) {


        socket.on('b-register', registerPeer);
        socket.on('b-forward-offer', forwardOffer);
        socket.on('b-forward-reply', forwardReply);
        socket.on('disconnect', peerRemove);


        function registerPeer() {
                // Handling duplicate peerId
                var peerId = -1;
                do {
                        peerId = Math.floor(Math.random() * Math.pow(2, config.get('dtrm.n_fingers')));
                } while (peers[peerId] !== undefined);
                // peerId = randomPeers[(counter++)%randomPeers.length];

                var destPeerId = null;

                // if (Object.keys(peers).length > 0) {
                        // destPeerId = randomPeers[counter-2];
                var keys = Object.keys(peers);
                        // keys.push(peerId);
                        // keys = keys.sort(function(a,b) {return a - b; });
                        // destPeerId = keys[(keys.indexOf(peerId) + 1)%keys.length];
                destPeerId = parseInt(keys[Math.floor(Math.random() * keys.length)]);
                // }

                peers[peerId] = socket;

                socket.emit('p-registered', {
                        peerId: peerId,
                        n_fingers: config.get('dtrm.n_fingers'),
                        stun_servers: [ 'stun:' + process.argv[2], 'stun:' + process.argv[3]],
                        post_url: process.argv[6],
                        destPeerId: destPeerId,
                        strategy: process.argv[4],
                        doFix: process.argv[5]
                });

                console.log('registered new peer: ', peerId);
        }

        function forwardOffer(dataToFwd) {
                console.log(dataToFwd.offer.srcPeerId + " ---forwarding offer---> " + dataToFwd.offer.destPeerId);
                peers[dataToFwd.offer.destPeerId]
                        .emit('p-forward-offer', dataToFwd);
        }

        function forwardReply(dataToFwd) {
                console.log(dataToFwd.offer.destPeerId + " ---forwarding reply---> " + dataToFwd.offer.srcPeerId);
                peers[dataToFwd.offer.srcPeerId]
                        .emit('p-forward-reply', dataToFwd);
        }

        function peerRemove() {
                Object.keys(peers).map(function(peerId) {
                        if (peers[peerId].id === socket.id){
                                var peerList = prompt.context.listPeers();
                                var succ = ((peerList.indexOf(peerId)+1)+peerList.length)%peerList.length;
                                var pred = ((peerList.indexOf(peerId)-1)+peerList.length)%peerList.length;

                                console.log("Disconnected: "+peerId);

                                console.log("Update predecessor of " + peerList[succ]+ " to --> " + peerList[pred]);
                                peers[peerList[succ]].emit('update', {
                                        isSucc: false,
                                        newConn: peerList[pred]
                                });

                                console.log("Update successor of " + peerList[pred]+ " to --> " + peerList[succ]);
                                peers[peerList[pred]].emit('update', {
                                        isSucc: true,
                                        newConn: peerList[succ]
                                });

                                delete peers[peerId];
                        }
                });
        }
}
