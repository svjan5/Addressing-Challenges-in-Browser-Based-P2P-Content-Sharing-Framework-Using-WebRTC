var Id = require('dht-id');
var waitUntil = require('wait-until');
// var suspend = require('co-suspend');

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
        self.msgToSelf = function(srcPeerId, msgId, type, data, path){
                peer.channelManager.messageHandler({
                        srcPeerId: srcPeerId,
                        msgId: msgId,
                        path: path,
                        type: type,
                        data: data
                });
        }

        self.findSuccessor = function(destPeerId, id, path){
                var msgId = new Id().toDec();
                self.responseTable[msgId] = null;

                if(destPeerId == self.peerId){
                        if(self.peerId == self.successor)
                                self.msgToSelf(self.peerId, msgId, "response", self.peerId, path);
                        
                        else if(isBetween(id, self.peerId, self.successor) || id == self.successor)
                                self.msgToSelf(self.peerId, msgId, "response", self.successor, path);
                        
                        else{
                                var node = self.closestPrecedingFinger(id);
                                if( node == self.peerId )
                                        self.findSuccessor(self.successor, id, path); //O(n)
                                else
                                        self.findSuccessor(node, id, path);           //O(log(n))
                        }
                }

                else{
                        var channel = self.connectorTable[destPeerId];
                        path += ","+ self.peerId;

                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.findSuccessor(" + destPeerId + "," + id + ",\""+path+"\")"
                        });
                }
                return msgId;
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