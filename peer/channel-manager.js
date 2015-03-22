var SimplePeer = require('simple-peer');
var Id = require('dht-id');

exports = module.exports = ChannelManager;

function ChannelManager(peerId, bootConn, nodeDetails) {
        var self = this;
        var isStabilize = true;
        var stabilizeData;

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
                        channel.on('ready', function() {
                                log('Peer1 : channel ready to send');

                                nodeDetails.bootPeer.peerId = replyData.offer.destPeerId;
                                nodeDetails.bootPeer.connector = channel;
                                nodeDetails.connectorTable[replyData.offer.destPeerId] = channel;

                                channel.on('message', self.messageHandler);
                                // node.
                                // self.joinNetwork();
                        });

                        channel.signal(replyData.offer.signal);
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
        self.joinNetwork = function(state, data) {
                switch (state) {

                        case 0:
                                /*Join function*/

                                nodeDetails.predecessor = null;
                                /*bootPeer.findSucessor(self.peerId)*/
                                var msgId = new Id().toDec();
                                nodeDetails.responseTable[msgId] = null;

                                nodeDetails.findSuccessor(
                                        nodeDetails.bootPeer.peerId,
                                        nodeDetails.peerId,
                                        "",
                                        msgId,
                                        "self.joinNetwork(1," + msgId + ")"

                                );
                                break;

                        case 1:
                                console.log("Join Network case 0 successful");
                                nodeDetails.successor = nodeDetails.responseTable[data];
                                delete nodeDetails.responseTable[msgId];
                                isStabilize = false;

                        case "stabilize":

                                if(isStabilize) {
                                        console.log("Stabilize got data:");
                                        console.log(data);
                                        stabilizeData = data;
                                }

                                var msgId = new Id().toDec();
                                nodeDetails.responseTable[msgId] = null;

                                nodeDetails.findPredOfSucc(
                                        nodeDetails.successor,
                                        "",
                                        msgId,
                                        "self.joinNetwork(2," + msgId + ")"
                                );

                                break;

                        case 2:
                                console.log("Join Network case 1 successful - value:"+ nodeDetails.responseTable[data]);
                                nodeDetails.succPreceding = nodeDetails.responseTable[data];
                                delete nodeDetails.responseTable[msgId];

                                if(nodeDetails.succPreceding != null){
                                        var key = nodeDetails.succPreceding;
                                        if ((nodeDetails.peerId == nodeDetails.successor) || isBetween(key, nodeDetails.peerId, nodeDetails.successor)) {
                                                console.log("HelloInside");
                                                nodeDetails.successor = nodeDetails.succPreceding;
                                        }
                                }
                                console.log("Hello");
                                var func = (!isStabilize) ? "self.joinNetwork(3," + msgId + ")" 
                                                          : "nodeDetails.msgToSelf(" + stabilizeData.srcPeerId  + "," + stabilizeData.msgId + ",\\\"" + stabilizeData.type + "\\\"," + stabilizeData.data + ",\\\"" + stabilizeData.path + "\\\",'" + stabilizeData.func + "');";

                                isStabilize = true;
                                console.log("Hello2");
                                var msgId = new Id().toDec();                                
                                nodeDetails.notifyPredecessor(
                                        nodeDetails.successor,
                                        nodeDetails.peerId,
                                        "",
                                        msgId,
                                        func
                                );
                                console.log("Hello3");
                                break;

                        case 3:
                                console.log("Join Network case 2 successful");
                                var msgId = new Id().toDec(); 

                                var callStabilizeOn = (nodeDetails.succPreceding == null) ? nodeDetails.successor 
                                                                                          : nodeDetails.succPreceding;
                                nodeDetails.stabilize(
                                        callStabilizeOn,
                                        "",
                                        msgId,
                                        "self.joinNetwork(4," + msgId + ")"
                                );
                                break;

                        case 4:
                                console.log("Join Network case 3 successful : "+ data);
                                break;

                }
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
                        self.joinNetwork(0, null);
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


                        case "request":
                                console.log("Request Received");
                                console.log(message);
                                console.log("Executing :"+ message.data);
                                var data = eval(message.data);
                                break;

                        case "response":
                                console.log("In response");
                                console.log(message);
                                var path = message.path.split(",");

                                if (path.length == 1){
                                        nodeDetails.responseTable[message.msgId] = message.data;
                                        console.log("Executing :"+message.func);
                                        eval(message.func);
                                }
                                else{
                                        console.log("Forward");
                                        var returnPeerId = parseInt(path.pop(),10);
                                        message.path = path.join();
                                        var channel = nodeDetails.connectorTable[returnPeerId];
                                        channel.send(message);
                                }
                                break;

                        case "make-connection":

                                break;
                }
        }
}