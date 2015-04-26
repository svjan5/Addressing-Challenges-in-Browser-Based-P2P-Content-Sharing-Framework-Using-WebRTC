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
                reply(peers);
        }
});

server.start(started);

function started() {
        io.listen(server.listener).on('connection', mainServerFunction);
        console.log('Signaling server has started on:', server.info.uri);
}

var peers = {};
// id : socket

// Console for server
var repl = require('repl');
var prompt = repl.start({
        prompt: 'server>'
});
prompt.context.peers = peers;
prompt.context.listPeer = function() {return Object.keys(peers)};

function mainServerFunction(socket) {


        socket.on('b-register', registerPeer);
        socket.on('b-forward-offer', forwardOffer);
        socket.on('b-forward-reply', forwardReply);
        socket.on('disconnect', peerRemove);


        function registerPeer() {
                // Handling duplicate peerId
                do {
                        var peerId = Math.floor(Math.random() * Math.pow(2, config.get('dtrm.n_fingers')));
                } while (peers[peerId] !== undefined);

                var destPeerId = null;

                if (Object.keys(peers).length > 0) {
                        var keys = Object.keys(peers);
                        destPeerId = parseInt(keys[Math.floor(Math.random() * keys.length)]);
                }

                peers[peerId] = socket;

                socket.emit('p-registered', {
                        peerId: peerId,
                        n_fingers: config.get('dtrm.n_fingers'),
                        destPeerId: destPeerId
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
                        if (peers[peerId].id === socket.id)
                                delete peers[peerId];
                });
        }
}
