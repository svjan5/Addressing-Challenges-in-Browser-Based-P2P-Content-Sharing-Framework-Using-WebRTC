var Id = require('dht-id');
var SimplePeer = require('simple-peer');
var bows = require('bows');
exports = module.exports = NodeDetails;

ndlog = bows('Node Details');

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
        self.queryBegTime = -1;
        self.queryEndTime = -1;
        self.joinBegTime = -1;
        self.joinEndTime = -1;
        self.msgCount = 0;
        self.connected = false;
        self.isICESlow = false;

        self.iceList = ["stun:192.168.0.101"/*, "stun:192.168.0.102", "stun:192.168.0.103", "stun:192.168.0.100", "stun:192.168.0.106", "stun:192.168.0.107"*/];

        self.channelTable = {};
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

        self.makeQuery = function(n) {
                self.queryBegTime = (new Date()).getTime();
                self.initFindSuccessor(self.peerId, n, 33333333333, "nodeDetails.queryComplete()");
        }

        self.queryComplete = function() {
                self.queryEndTime = (new Date()).getTime() - self.queryBegTime;
                ndlog("----------------------------------------------------------------------->>>>>" + self.queryEndTime);
        }


        self.findSuccessor = function(srcPeerId ,callonId, id, msgId, func, signal) {
                ndlog("FIND SUCCESSOR(" + srcPeerId +", "+ callonId + ", " + id + ", " + msgId + ", " + func + ", " + "signal" + ")");

                if (callonId == self.peerId) {
                        if (self.peerId == self.successor){
                                self.forwardPacket({
                                        data: self.peerId,
                                        destPeerId: srcPeerId,
                                        func: func,
                                        msgId: msgId,
                                        signal: null,
                                        srcPeerId: self.peerId,
                                        type: "response"
                                });
                        }

                        else if ( isBetween(id, self.peerId, self.successor) || id == self.successor) {
                                var message = {
                                        conId: srcPeerId,
                                        data: "",
                                        destPeerId: srcPeerId,
                                        func: func,
                                        msgId: msgId,
                                        signal: signal,
                                        srcPeerId: self.peerId,
                                        type: "signal-accept"
                                };
                                ndlog("sending to " + self.successor); ndlog(message);
                                self.forwardPacket(message);
                        } 

                        else {
                                var node = self.closestPrecedingFinger(id);
                                if (node == self.peerId)
                                        self.findSuccessor(srcPeerId, self.successor, id, msgId, func, signal); //O(n)
                                else
                                        self.findSuccessor(srcPeerId, node, id, msgId, func, signal); //O(log(n))
                        }
                } else {
                        var message = {
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                msgId: msgId,
                                type: "request",
                                data: "nodeDetails.findSuccessor(" + srcPeerId +","+ callonId + "," + id +","+ msgId + ",\"" + func + "\",\'" + signal + "\')",
                                func: func,
                                signal: signal
                        }

                        ndlog("sending to " + callonId); ndlog(message);
                        self.forwardPacket(message);
                }
        }

        self.findSuccessor2 = function(srcPeerId, callonId, id, msgId, func){
                ndlog("FIND SUCCESSOR2(" +srcPeerId +"," + callonId + ", " + id + ", " + msgId + ", " + func + ")");

                if(callonId == self.peerId){
                        if(self.peerId == self.successor){
                                self.forwardPacket({
                                        data: self.peerId,
                                        func: func,
                                        msgId: msgId,
                                        srcPeerId: self.peerId,
                                        destPeerId: srcPeerId,
                                        type: "strategy2res"
                                })
                        }

                        else if ( isBetween(id, self.peerId, self.successor) || id == self.successor) {
                                self.forwardPacket({
                                        data: self.successor,
                                        destPeerId: srcPeerId,
                                        func: func,
                                        msgId: msgId,
                                        srcPeerId: self.peerId,
                                        type: "strategy2res"
                                })
                        }

                        else{
                                var node = self.closestPrecedingFinger(id);
                                if (node == self.peerId)
                                        self.findSuccessor2(srcPeerId, self.successor, id, msgId, func); //O(n)
                                else
                                        self.findSuccessor2(srcPeerId, node, id, msgId, func); //O(log(n))
                        }
                }
                else{
                        self.forwardPacket({
                                data: "nodeDetails.findSuccessor2(" + srcPeerId +","+ callonId +","+ id +","+ msgId +",\""+ func + "\")",
                                func: func,
                                msgId: msgId,
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                type: "request"
                        });
                }

        }

        self.initFindSuccessor = function(callonId, id, msgId, func) {
                if(!self.isICESlow) {
                        var signalId = new Id().toDec();

                        self.channelTable[signalId] = new SimplePeer({
                                initiator: true,
                                trickle: false,
                                reconnectTimer: 1000,
                                config: {iceServers: [{url: self.iceList[self.peerId % self.iceList.length] }] }
                        });

                        self.channelTable[signalId].on('signal', function(signal) {
                                signal.id = signalId;
                                signal = peer.channelManager.encodeSignal(signal);
                                self.findSuccessor(self.peerId, callonId, id, msgId, func, signal);
                        });
                }
                else {
                        self.findSuccessor2(self.peerId, callonId, id, msgId, func)
                }
        }


        self.forwardPacket = function(packet){
                ndlog("FORWARD PACKET("); ndlog(packet);
                var destPeerId = null;
                var peerId = packet.destPeerId;

                if(self.peerId == peerId){
                        ndlog("Message for self !!!!!!!!!!!!!!!!!!!!");
                        peer.channelManager.messageHandler(packet);
                        return;
                }
                else if (isBetween(peerId, self.peerId, self.successor) || peerId == self.successor) {
                        destPeerId = self.successor;
                }
                else if (Object.keys(self.connectorTable).indexOf(peerId+"") != -1){
                        destPeerId = peerId;
                }
                else {
                        destPeerId = self.closestPrecedingFinger(peerId);
                        if(destPeerId == self.peerId)
                                destPeerId = self.successor;
                }

                var channel = self.connectorTable[destPeerId];
                ndlog("forwardPacket: forwarding to :"+ destPeerId);
                self.msgCount++;
                channel.send(packet);
        }
        
        self.connectViaPeer = function(peerId, callback){
                var signalId = new Id().toDec();

                self.channelTable[signalId] = new SimplePeer({
                        initiator: true,
                        trickle: false,
                        reconnectTimer: 1000,
                        config: {iceServers: [{url: self.iceList[self.peerId % self.iceList.length] }] }
                });

                self.channelTable[signalId].on('signal', function(signal) {
                        signal.id = signalId;
                        signal = peer.channelManager.encodeSignal(signal);

                        self.forwardPacket({
                                type: "peer-connect-offer",
                                srcPeerId: self.peerId,
                                destPeerId: peerId,
                                signal: signal,
                                func: callback
                        });
                });
        }

        self.initFindPredOfSucc = function(destPeerId, msgId, func) {
                if(!self.isICESlow){
                        var signalId = new Id().toDec();

                        self.channelTable[signalId] = new SimplePeer({
                                initiator: true,
                                trickle: false,
                                reconnectTimer: 1000,
                                config: {iceServers: [{url: self.iceList[self.peerId % self.iceList.length] }] }
                        });

                        self.channelTable[signalId].on('signal', function(signal) {
                                signal.id = signalId;
                                signal = peer.channelManager.encodeSignal(signal);
                                self.findPredOfSucc(self.peerId, destPeerId, msgId, func, signal);
                        });
                }
                else{
                        self.findPredOfSucc2(self.peerId, destPeerId, msgId, func);
                }
        }

        self.findPredOfSucc2 = function(srcPeerId, callonId, msgId, func){
                ndlog("FIND PREDOFSUCC(" + srcPeerId +","+ callonId + ", " + msgId + ", " + func );

                if(callonId == self.peerId){
                        self.forwardPacket({
                                srcPeerId: self.peerId,
                                destPeerId: srcPeerId,
                                msgId: msgId,
                                data: self.predecessor,
                                type: "strategy2res",
                                func: func
                        });
                }
                else{
                        self.forwardPacket({
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                func: func,
                                msgId: msgId,
                                type: "request",
                                data: "nodeDetails.findPredOfSucc2(" + srcPeerId +","+ callonId + ","+ msgId +",\""+ func + "\")"
                        });
                }
        }

        self.findPredOfSucc = function(srcPeerId, callonId, msgId, func, signal) {
                ndlog("FIND PREDOFSUCC(" + srcPeerId +","+ callonId + ", " + msgId + ", " + func + ", signal)");

                if (callonId == self.peerId) {
                        if (self.peerId == self.successor){
                                self.forwardPacket({
                                        srcPeerId: self.peerId,
                                        destPeerId: srcPeerId,
                                        msgId: msgId,
                                        data: self.predecessor,
                                        type: "response",
                                        signal: null,
                                        func: func
                                });
                        }

                        else {
                                ndlog("sending to " + self.predecessor);
                                self.forwardPacket({
                                        conId: srcPeerId,
                                        srcPeerId: self.peerId,
                                        destPeerId: self.predecessor,
                                        msgId: msgId,
                                        data: self.predecessor,
                                        type: "signal-accept",
                                        signal: signal,
                                        func: func
                                });
                        }
                } 
                else {
                        ndlog("sending to " + callonId);
                        self.forwardPacket({
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                msgId: msgId,
                                type: "request",
                                data: "nodeDetails.findPredOfSucc(" + srcPeerId +","+ callonId +","+ msgId + ",\"" + func + "\",\'" + signal + "\')",
                                func: func,
                                signal: signal
                        });
                }
        }


        self.notifyPredecessor = function(callonId, msgId){
                ndlog("NOTIFY PREDECESSOR("+ callonId + ", " + msgId + ")");

                self.msgCount++;
                self.forwardPacket({
                        srcPeerId: self.peerId,
                        destPeerId: callonId,
                        msgId: msgId,
                        type: "request",
                        data: "nodeDetails.predecessor = " + self.peerId
                });

        }

        self.notifySuccessor = function(callonId, msgId){
                ndlog("NOTIFY SUCCESSOR("+ callonId + ", " + msgId + ")");

                self.msgCount++;
                self.forwardPacket({
                        srcPeerId: self.peerId,
                        destPeerId: callonId,
                        msgId: msgId,
                        type: "request",
                        data: "nodeDetails.successor = " + self.peerId
                });
        }

        self.destroyExtraConn = function(){
                existing = Object.keys(self.connectorTable).sort();
                needed = [];

                for (var i = 0; i < self.fingerTable.length ; i++) {
                        needed.push(self.fingerTable[i].fingerId);
                };
                needed.push(self.successor);
                needed.push(self.predecessor);
                needed.push(self.bootPeer.peerId);
                
                existing = existing.map(function (x) {return parseInt(x, 10); });

                needed.sort(function(a, b){return a-b});
                existing.sort(function(a, b){return a-b});
                

                existing = existing.filter(function(elem, index, self) {return index == self.indexOf(elem); })
                needed = needed.filter(function(elem, index, self) {return index == self.indexOf(elem); })

                ndlog("Beginning: ");
                ndlog(typeof(existing));
                ndlog(typeof(needed));
                ndlog("Exisiting: " + existing);
                ndlog("Needed: " + needed);

                diff = existing.filter(function(x) { return needed.indexOf(x) < 0 })
                diff = [];
                for (var i=0; i<existing.length; i++){
                        if( needed.indexOf(existing[i]) == -1)
                                diff.push(existing[i]);
                }

                ndlog("Diff: " + diff); 

                for (var i=0; i<diff.length; i++){
                        self.connectorTable[diff[i]].destroy();
                        delete self.connectorTable[diff[i]];
                }
        }

        self.fixFingers = function(i, srcPeerId) {
                ndlog("CALLED FIX FINGERS: " + i);

                if (i >= self.fingerTable.length){
                        // channelManager.getMsgCount();
                        if(srcPeerId != null){
                                var channel = self.connectorTable[self.successor];
                                channel.send({
                                        srcPeerId: srcPeerId,
                                        type: "fixfingers"
                                });
                        }
                        // self.destroyExtraConn();
                        return;
                }

                var key = self.fingerTable[i].start;
                var msgId = new Id().toDec();
                self.responseTable[msgId] = null;

                self.initFindSuccessor(
                        self.peerId,
                        key,
                        msgId,
                        "nodeDetails.updateFinger(" + i + ", message.data," + srcPeerId + ")"
                );
        }

        self.updateFinger = function(i, data, srcPeerId) {
                self.fingerTable[i].fingerId = data;
                self.fixFingers(i + 1, srcPeerId);
        }

        self.closestPrecedingFinger = function(id) {
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