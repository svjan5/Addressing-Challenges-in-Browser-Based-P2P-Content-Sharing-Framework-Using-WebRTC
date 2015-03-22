var Id = require('dht-id');

exports = module.exports = NodeDetails;

function NodeDetails(peer, peerId, n_fingers) {
        var self = this;
        var MOD = Math.pow(2, n_fingers);

        self.peerId = peerId;
        self.fingerTable = [];

        self.bootPeer = {
                peerId: null,
                connector: null
        };

        self.successor = self.peerId;;
        self.predecessor = null;
        self.succPreceding = null;
        
        self.connectorTable = {};
        self.responseTable = {};
        self.marker;
        initializeFingerTable(n_fingers);

        function initializeFingerTable(n_fingers) {
                for (var i = 0; i < n_fingers; i++) {
                        var start = (self.peerId + Math.pow(2, i)) % MOD;
                        self.fingerTable[i] = {
                                start: start,
                                fingerId: self.peerId
                        };
                }
        }

        // self.join = function(destPeerId){}
        self.msgToSelf = function(srcPeerId, msgId, type, data, path, func){
                peer.channelManager.messageHandler({
                        srcPeerId: srcPeerId,
                        msgId: msgId,
                        path: path,
                        type: type,
                        data: data,
                        func: func
                });
        }

        self.findSuccessor = function(destPeerId, id, path, msgId, func){
                console.log("FIND SUCCESSOR !!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                if(destPeerId == self.peerId){
                        if(self.peerId == self.successor)
                                self.msgToSelf(self.peerId, msgId, "response", self.peerId, path, func);
                        
                        else if(isBetween(id, self.peerId, self.successor) || id == self.successor)
                                self.msgToSelf(self.peerId, msgId, "response", self.successor, path, func);
                        
                        else{
                                var node = self.closestPrecedingFinger(id);
                                if( node == self.peerId )
                                        self.findSuccessor(self.successor, id, path, msgId, func); //O(n)
                                else
                                        self.findSuccessor(node, id, path, msgId, func);           //O(log(n))
                        }
                }

                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) console.log("Connector: "+ channel);
                        path += ","+ self.peerId;

                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.findSuccessor(" + destPeerId + "," + id + ",\"" + path + "\"," + msgId + ",\"" + func + "\" )",
                                func: func
                        });
                }
        }

        self.findPredOfSucc = function(destPeerId, path, msgId, func){
                if( destPeerId == self.peerId) 
                        self.msgToSelf(self.peerId, msgId, "response", self.predecessor, path, func);
                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) console.log("Connector: "+ channel);
                        path += ","+ self.peerId;

                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.findPredOfSucc(" + destPeerId + ",\"" + path + "\"," + msgId + ",\"" + func + "\" )",
                                func: func
                        });
                }

        }

        self.notifyPredecessor = function(destPeerId, data, path, msgId, func){
                if( destPeerId == self.peerId){
                        console.log("Hello");
                        self.predecessor = data;
                        self.msgToSelf(self.peerId, msgId, "response", null, path, func);
                }
                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) console.log("Connector: "+ channel);
                        path += ","+ self.peerId;

                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.notifyPredecessor(" + destPeerId + "," + data + ",\"" + path + "\"," + msgId + ",\"" + func + "\" )",
                                func: func
                        });
                }

        }
         //"nodeDetails.stabilize(52,",45",38326717949206,"self.joinNetwork(4,38326717949206)" )"
        self.stabilize = function(destPeerId, path, msgId, func){
                if( destPeerId == self.peerId){
                        var data = {
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                type: "response",
                                data: null,
                                path: path,
                                func: func
                        }
                        peer.channelManager.joinNetwork( "stabilize", data);
                        // self.msgToSelf(self.peerId, msgId, "response", null, path, func);
                }
                
                else{
                        var channel = self.connectorTable[destPeerId];
                        console.log("Connector: "+ channel);
                        path += ","+ self.peerId;

                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.stabilize(" + destPeerId + ",\"" + path + "\"," + msgId + ",\"" + func + "\" )",
                                func: func
                        });
                }

        }

        self.closestPrecedingFinger = function(id){
                for (var i = n_fingers - 1; i >= 0; i--) {
                        var fingerId = self.fingerTable[i].fingerId;
                        if (isBetween(fingerId, self.peerId, id))
                                return fingerId;
                }
                return self.peerId;
        }

        /* peerId <belongs to> (fromKey,toKey) exclusive*/
        function isBetween(peerId, fromKey, toKey) {
                if (fromKey > toKey) return (peerId > fromKey || peerId < toKey);
                else return (peerId > fromKey && peerId < toKey);
        }

}