var Id = require('dht-id');
exports = module.exports = NodeDetails;

function NodeDetails(peer, peerId, n_fingers) {
        var self = this;
        var MOD = Math.pow(2, n_fingers);
        var channelManager = peer.channelManager;

        self.peerId = peerId;
        self.fingerTable = {};

        self.bootPeer = {
                peerId: null,
                connector: null
        };

        self.successor = {
                peerId: self.peerId,
                connector: null
        };

        self.predecessor = {
                peerId: null,
                connector: null
        };
        
        self.connectorTable = {};
        // self.keys = Object.keys(self.fingerTable);
        // self.connectorIds = [];
        // self.connectorIds.push(self.peerId);

        initializeFingerTable(n_fingers);
        

        function initializeFingerTable(n_fingers) {
                for (var i = 0; i < n_fingers; i++) {
                        var index = (self.peerId + Math.pow(2, i)) % MOD;
                        self.fingerTable[index] = {
                                fingerId: self.peerId,
                                connector: null
                        };
                }
        }

        /*self.join = function(){
                self.successor = self.bootPeer.connector.send({
                        
                })
        }*/

        self.findSuccessor = function(peerId) {
                // One node in network
                if (self.peerId == self.successor.peerId)
                        return self.peerId;

                if (isBetween(peerId, self.peerId, self.successor.peerId) || peerId == self.successor.peerId)
                        return self.successor;

                else {
                        var node = self.closestPrecedingFinger(peerId);
                        if (node == self)
                                return self.successor.findSuccessor(peerId);
                        else
                                return node.findSuccessor(peerId);
                }
        }

        self.findPredecessor = function(peerId){
                var remotePeerId = self.peerId;
                while(!isBetween(peerId, remotePeerId, getSucessor(remotePeerId))){
                        remotePeerId = getClosestPrecedingFinger(remotePeerId, peerId);
                }
                return remotePeerId;
        }

        self.closestPrecedingFinger = function(peerId){
                for (var i = n_fingers - 1; i >= 0; i--) {
                        var fingerEntry = self.fingerTable[self.keys[i]].fingerId;
                        if (isBetween(fingerEntry, self.peerId, peerId))
                                return fingerEntry;
                }
        }

        self.getClosestPrecedingFinger = function(destPeerId,peerId){
                if(destPeerId == self.peerId)
                        return self.closestPrecedingFinger(peerId);
                else{
                        
                }
        }

        /* peerId <belongs to> (fromKey,toKey) exclusive*/
        function isBetween(peerId, fromKey, toKey) {
                if (fromKey > toKey) return (peerId > fromKey || peerId < toKey);
                else return (peerId > fromKey && peerId < toKey);
        }

}