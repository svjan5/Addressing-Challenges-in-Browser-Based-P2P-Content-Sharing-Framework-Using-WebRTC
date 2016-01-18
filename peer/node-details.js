var Id = require('dht-id');
var SimplePeer = require('simple-peer');
var bows = require('bows');
exports = module.exports = NodeDetails;

ndlog = bows('Node Details');

function NodeDetails(peer, peerId, n_fingers, stun_servers, post_url, strategy, doFix) {
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
        
        self.SIGDELAY = 1000;
        self.SIGQUERYDELAY = 500;
        self.PCKDELAY = 50;

        self.SIGDELAY = 0;
        self.SIGQUERYDELAY = 0;
        self.PCKDELAY = 0;

        self.sigGenTime = self.SIGDELAY;
        self.sigQueryTime = self.SIGQUERYDELAY;
        self.pcktFwdTime = self.PCKDELAY;
        self.fixDelay = 1000;


        self.msgCount = 0;
        self.connected = false;
        self.isICESlow = (strategy == 1)?false :true;
        self.fixCallReturned = false;
        self.doFix = (doFix == "fix") ?true :false;

        self.postURL = "http://" +post_url;
        self.iceList = stun_servers;
        //["stun:74.125.200.127:19302", "stun:173.194.72.127:19302", "stun:74.125.194.127:19302", "stun:74.125.142.127:19302", "stun:74.125.196.127:19302"];
        // self.iceList = ["stun:192.168.0.101", "stun:192.168.0.102", "stun:192.168.0.100", "stun:192.168.0.104", "stun:192.168.0.105", "stun:192.168.0.107"];

        self.channelTable = {};
        self.connectorTable = {};
        self.responseTable = {};
        self.forwardTable = {};
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


        self.findSuccessor = function(srcPeerId ,callonId, id, conId, msgId, func, signal) {
                ndlog("FIND SUCCESSOR(" + srcPeerId +", "+ callonId + ", " + id + ", " + conId + ", " + msgId + ", " + func + ", " + "signal" + ")");

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
                                        conId: conId,
                                        fwdId: srcPeerId,
                                        data: self.successor,
                                        destPeerId: self.successor,
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
                                        self.findSuccessor(srcPeerId, self.successor, id, conId, msgId, func, signal); //O(n)
                                else
                                        self.findSuccessor(srcPeerId, node, id, conId, msgId, func, signal); //O(log(n))
                        }
                } else {
                        var message = {
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                msgId: msgId,
                                type: "request",
                                data: "nodeDetails.findSuccessor(" + srcPeerId +","+ callonId + "," + id +","+ conId +","+ msgId + ",\"" + func + "\",\'" + signal + "\')",
                                func: func,
                                signal: signal
                        }

                        if(!self.connected) {
                                message.type = "request-forward";
                                message.data = "nodeDetails.findSuccessor(" + callonId +","+ callonId + "," + id +","+ srcPeerId +","+ msgId + ",\"" + func + "\",\'" + signal + "\')";
                        }

                        ndlog("sending to " + callonId); ndlog(message);
                        self.forwardPacket(message);
                }
        }

        self.findSuccessor2 = function(srcPeerId, callonId, id, conId, msgId, func){
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
                                        conId: conId,
                                        fwdId: srcPeerId,
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
                                        self.findSuccessor2(srcPeerId, self.successor, id, conId, msgId, func); //O(n)
                                else
                                        self.findSuccessor2(srcPeerId, node, id, conId, msgId, func); //O(log(n))
                        }
                }
                else{
                        var message = {
                                data: "nodeDetails.findSuccessor2(" + srcPeerId + "," + callonId + "," + id + ","+ conId +","+ msgId + ",\"" + func + "\")",
                                func: func,
                                msgId: msgId,
                                srcPeerId: self.peerId,
                                destPeerId: callonId,
                                type: "request"
                        };

                        if(!self.connected) {
                                message.type = "request-forward";
                                message.data = "nodeDetails.findSuccessor2(" + callonId +","+ callonId + "," + id +","+ srcPeerId +","+ msgId + ",\"" + func + "\")";
                        }

                        ndlog("sending to " + callonId);
                        self.forwardPacket(message);
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
                                if(self.sigGenTime == 0) self.findSuccessor(self.peerId, callonId, id, self.peerId, msgId, func, signal);
                                else {
                                        setTimeout(function() {
                                                self.findSuccessor(self.peerId, callonId, id, self.peerId, msgId, func, signal);
                                                ndlog("initFindSuccessor: Signal generated");
                                        }, self.sigGenTime);
                                }
                        });
                }
                else {
                        self.findSuccessor2(self.peerId, callonId, id, self.peerId, msgId, func)
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
                else if(self.peerId == self.successor){
                        destPeerId = self.bootPeer.peerId;
                }
                else if (Object.keys(self.connectorTable).indexOf(peerId+"") != -1){
                        destPeerId = peerId;
                }
                else if (isBetween(peerId, self.peerId, self.successor) || peerId == self.successor) {
                        destPeerId = self.successor;
                }
                else {
                        destPeerId = self.closestPrecedingFinger(peerId);
                        if(destPeerId == self.peerId)
                                destPeerId = self.successor;
                }

                var channel = self.connectorTable[destPeerId];
                ndlog("forwardPacket: forwarding to :"+ destPeerId);
                self.msgCount++;
                if(self.pcktFwdTime == 0) channel.send(packet);
                else setTimeout(function(){channel.send(packet); }, self.pcktFwdTime);
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
                        message = {
                                type: "peer-connect-offer",
                                conId: self.peerId,
                                fwdId: self.peerId,
                                srcPeerId: self.peerId,
                                destPeerId: peerId,
                                signal: signal,
                                func: callback,
                                flag: true
                        };

                        if(self.sigGenTime == 0) self.forwardPacket(message);
                        else{
                                setTimeout(function() {
                                        self.forwardPacket(message);
                                        ndlog("connectViaPeer: Signal generated");
                                }, self.sigGenTime);
                        }
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

                                if(self.sigGenTime == 0) self.findPredOfSucc(self.peerId, destPeerId, msgId, func, signal);
                                else{
                                        setTimeout(function() {
                                                self.findPredOfSucc(self.peerId, destPeerId, msgId, func, signal);
                                                ndlog("initFindPredOfSucc: Signal generated");
                                        }, self.sigGenTime);
                                }
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
                                        fwdId: srcPeerId,
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


        self.notifyPredecessor = function(callonId, msgId, func){
                ndlog("NOTIFY PREDECESSOR("+ callonId + ", " + msgId + ")");

                self.msgCount++;
                self.forwardPacket({
                        srcPeerId: self.peerId,
                        destPeerId: callonId,
                        msgId: msgId,
                        type: "notify",
                        data: "nodeDetails.predecessor = " + self.peerId,
                        func: func
                });

        }

        self.notifySuccessor = function(callonId, msgId, func){
                ndlog("NOTIFY SUCCESSOR("+ callonId + ", " + msgId + ")");

                self.msgCount++;
                self.forwardPacket({
                        srcPeerId: self.peerId,
                        destPeerId: callonId,
                        msgId: msgId,
                        type: "notify",
                        data: "nodeDetails.successor = " + self.peerId,
                        func: func
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
                        
                        if(srcPeerId != null){
                                var channel = self.connectorTable[self.successor];
                                channel.send({
                                        srcPeerId: srcPeerId,
                                        type: "fixfingers"
                                });
                        }

                        if(self.fixCallReturned){
                                peer.channelManager.getMsgCount();
                                peer.channelManager.setDelay();
                                self.fixCallReturned = false;
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