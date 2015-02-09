var Id = require('dht-id');

exports = module.exports = NodeDetails;

function NodeDetails(peerId, n_fingers){
        var self = this;
        self.peerId = peerId;
        self.sucessor = self.id;
        self.predecessor = self.id;
        self.fingerTable = {};

        function initializeFingerTable (n_fingers) {
        	for(var i=0;i<n_fingers;i++){
        		var index = self.peerId.toDec() + Math.pow(2,i);
        		self.fingerTable[index] = {
        			fingerId: self.peerId, 
        			connector: null
        		};
        	}
        }
        

}