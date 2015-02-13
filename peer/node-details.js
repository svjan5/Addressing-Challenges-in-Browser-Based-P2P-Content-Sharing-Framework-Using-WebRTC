var Id = require('dht-id');
exports = module.exports = NodeDetails;

function NodeDetails(peerId, n_fingers) {
        var self = this;
        var MOD = Math.pow(2, n_fingers);

        self.peerId = peerId;
        self.sucessor = {
                peerId: self.peerId,
                connector: null
        };
        self.predecessor = {
                peerId: null,
                connector: null
        };
        self.fingerTable = {};
        initializeFingerTable(n_fingers);
        self.keys = Object.keys(self.fingerTable);
        self.connectorIds = [];
        self.connectorIds.push(self.peerId);

        function initializeFingerTable(n_fingers) {
                for (var i = 0; i < n_fingers; i++) {
                        var index = (self.peerId + Math.pow(2, i)) % MOD;
                        self.fingerTable[index] = {
                                fingerId: peerId,
                                connector: null
                        };
                }
        }

        self.addFingerEntry = function(otherPeerId, channel) {
                var i, j, index, posToAdd;

                self.connectorIds.push(otherPeerId);
                self.connectorIds.sort(function(a,b){return a > b;});

                // console.log("Inserting " + otherPeerId +" entry in finger table of "+self.peerId);

                for (i = 0; i < n_fingers - 1; i++) {
                        var flag = false;
                        index = self.keys[i];

                        for(j = 0; j<self.connectorIds.length ;j++){

                                if(index <= self.connectorIds[j]) {
                                        posToAdd = j;
                                        flag = true;
                                        break;
                                }

                        }
                        if(!flag) posToAdd = 0;

                        if(self.connectorIds[posToAdd] == otherPeerId){
                                console.log("Adding "+self.connectorIds[posToAdd]+" to "+index);
                                self.fingerTable[index].fingerId = otherPeerId;
                                self.fingerTable[index].connector = channel;
                        }
                }
                console.log(self.fingerTable);
        }

        self.getFingerEntry = function(otherPeerId) {
                // var i, j, index, posToAdd;


                // for (i = 0; i < n_fingers - 1; i++) {
                //         var flag = false;
                //         index = self.keys[i];
                //         for(j = 0; j<self.connectorIds.length ;j++){
                //                 if(index <= self.connectorIds[j]) {
                //                         posToAdd = j;
                //                         flag = true;
                //                         break;
                //                 }
                //         }
                //         if(!flag) posToAdd = n_fingers;
                //         console.log(otherPeerId+" "+ index);
                //         return self.fingerTable[index].connector;
                // }
                var i,j;
                self.keys.sort(function(a,b){return a > b;});

                if(self.keys[n_fingers-1] < otherPeerId )
                        return self.fingerTable[self.keys[0]].connector;

                for(var i=n_fingers-2; i>=0; i--){
                        var flag = false;
                        index = self.keys[i];

                        if(index < otherPeerId){
                                return self.fingerTable[self.keys[i+1]].connector;
                        }
                }
                return self.fingerTable[self.keys[0]].connector;
        }

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