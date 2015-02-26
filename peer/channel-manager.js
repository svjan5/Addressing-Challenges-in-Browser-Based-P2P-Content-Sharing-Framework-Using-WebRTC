var SimplePeer = require('simple-peer');
var Id = require('dht-id');
var waitUntil = require('wait-until');
// var sleep = require('sleep');

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

                                channel.on('message', self.messageHandler);
                                // node.
                                // self.joinNetwork();
                        });
                });
        };
/*
for (var i = 0; i < chord.nodeList.length; i++) {

        0 -> if(i == 0) continue;                            //0
        0 -> var node = chord.nodeList[i];                   //0
        0 -> node.join(chord.getNode(0));                    //0
        1 -> var preceding = node.successor.predecessor;
        2 -> node.stabilize();
        3 -> if(preceding == null) node.successor.stabilize();
        4 -> else preceding.stabilize(); 
};
*/
        self.joinNetwork = function(state,data){
                switch(state){
                        case 0: /*Join function*/
                                nodeDetails.predecessor = null;
                                // bootPeer.findSucessor(self.peerId)
                                nodeDetails.findSuccessor(nodeDetails.bootPeer.peerId, nodeDetails.peerId, []);
                                break;
                        case 1:
                                channelManager.messageHandler({
                                        srcPeerId: self.peerId,
                                        msgId: message.msgId,
                                        type: "response",
                                        data: self.findSuccessor()
                                });


                }
                /*var preceding;

                if(nodeDetails.peerId == nodeDetails.successor){
                        preceding = nodeDetails.predecessor;
                }

                else{
                        var destPeerId = nodeDetails.successor;
                        var channel = nodeDetails.connectorTable[destPeerId];
                        var msgId = new Id().toDec();
                        nodeDetails.responseTable[msgId] = null;
                        console.log(channel);

                        channel.send({
                                srcPeerId: nodeDetails.peerId,
                                msgId: msgId,
                                type: "request",
                                data: "nodeDetails.predecessor"
                        });

                        while (nodeDetails.responseTable[msgId] !== null){
                                preceding = nodeDetails.responseTable[msgId];
                                delete nodeDetails.responseTable[msgId];
                                console.log("Preceding :" + preceding);
                        }
                }*/
        }

        bootConn.on('p-forward-offer', function(fwddData) {
                console.log("Peer2: signal received");
                var channel = new SimplePeer({
                        trickle: false
                });

                channel.on('ready', function() {
                        log('Peer2 : ready to listen');

                        channel.on('message', self.messageHandler);
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

        self.messageHandler = function(message){
                var channel = nodeDetails.connectorTable[message.srcPeerId];
                switch(message.type){

                        case "chat-init":
                                console.log(message);
                                channel.send({
                                        srcPeerId: peerId,
                                        type: "chat-ack",
                                        data: "I am fine"
                                });
                                break;

                        case "chat-ack":
                                console.log(message);
                                break;

                        case "forward":

                        case "request":
                                console.log("Request Received");
                                console.log(message);
                                var data = eval(message.data);
                                // channel.send({
                                //         srcPeerId: peerId,
                                //         msgId: message.msgId,
                                //         path: message.path,
                                //         type: "response",
                                //         data: data
                                // });
                                // console.log(message);
                                break;

                        case "response":
                                console.log("In response");
                                console.log(message);
                                var path = message.path.split(",");

                                if (path.length == 1){
                                        console.log("For current");
                                        nodeDetails.responseTable[message.msgId] = message.data;
                                        console.log("Got find sucessor return :");console.log(message);
                                }
                                else{
                                        console.log("Forward");
                                        var returnPeerId = parseInt(path.pop(),10);
                                        console.log("return Id : "+returnPeerId);
                                        console.log(path);
                                        message.path = path.join();
                                        console.log(message);
                                        var channel = nodeDetails.connectorTable[returnPeerId];
                                        channel.send(message);
                                }
                                // nodeDetails.marker.resume(function(){}, message.data);
                                break;
                }
        }
}