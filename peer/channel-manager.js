var SimplePeer = require('simple-peer');

exports = module.exports = ChannelManager;

function ChannelManager(peerId, bootConn, nodeDetails) {
        var self = this;

        // Establish a connection to another peer
        self.connect = function(destPeerId) {
                log('connecting to: ', destPeerId);

                var intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now();

                var channel = new SimplePeer({
                        initiator: true,
                        trickle: false
                });

                channel.on('signal', function(signal) {
                        log("Peer1 : Signal generated "); //+ "intentId:"+ intentId + "  srcPeerId:" + peerId + " destPeerId:" + destPeerId );

                        bootConn.emit('b-forward-offer', {
                                offer: {
                                        intentId: intentId,
                                        srcPeerId: peerId,
                                        destPeerId: destPeerId,
                                        signal: signal
                                }
                        });
                });

                bootConn.on('p-forward-reply', function(replyData) {
                        // Error handling
                        if (replyData.offer.intentId !== intentId) {
                                log('Peer1: not right intentId: ', replyData.offer.intentId, intentId);
                                return;
                        }

                        log('Peer1: offerAccepted');

                        // to form direct connection between peers
                        channel.signal(replyData.offer.signal);
                        channel.on('ready', function() {
                                log('Peer1 : channel ready to send');

                                nodeDetails.bootPeer.peerId = replyData.offer.destPeerId;
                                nodeDetails.bootPeer.connector = channel;
                                nodeDetails.connectorTable[replyData.offer.destPeerId] = channel;

                                channel.on('message', messageHandler);
                                // nodeDetails.join();
                        });
                });
        };

        bootConn.on('p-forward-offer', function(fwddData) {
                console.log("Peer2: signal received");
                var channel = new SimplePeer({
                        trickle: false
                });

                channel.on('ready', function() {
                        log('Peer2 : ready to listen');

                        channel.on('message', messageHandler);
                        nodeDetails.bootPeer.peerId = fwddData.offer.srcPeerId;
                        nodeDetails.bootPeer.connector = channel;
                        nodeDetails.connectorTable[fwddData.offer.srcPeerId] = channel;

                        channel.send({
                                srcPeerId: fwddData.offer.destPeerId,
                                type: "chat-init",
                                data: "how are you?"
                        });
                });

                channel.on('signal', function(signal) {
                        log('Peer2 : sending back my signal data');
                        fwddData.offer.signal = signal;
                        bootConn.emit('b-forward-reply', fwddData);
                });

                channel.signal(fwddData.offer.signal);

        });

        function messageHandler(message){
                var channel = nodeDetails.connectorTable[message.srcPeerId];
                switch(message.type){

                        case "chat-init":
                                console.log(message);
                                channel.send({
                                        srcPeerId: self.peerId,
                                        type: "chat-ack",
                                        data: "I am fine"
                                });
                                break;

                        case "chat-ack":
                                console.log(message);
                                break;

                }
        }
}