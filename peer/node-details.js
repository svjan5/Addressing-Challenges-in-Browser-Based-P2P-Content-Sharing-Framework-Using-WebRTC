var Id = require('dht-id');
var SimplePeer = require('simple-peer');
var bows = require('bows');
var Base64 = {_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function(e) {var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) {n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) {u = a = 64 } else if (isNaN(i)) {a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function(e) {var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9\+\/\=]/g, ""); while (f < e.length) {s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) {t = t + String.fromCharCode(r) } if (a != 64) {t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function(e) {e = e.replace(/\r\n/g, "\n"); var t = ""; for (var n = 0; n < e.length; n++) {var r = e.charCodeAt(n); if (r < 128) {t += String.fromCharCode(r) } else if (r > 127 && r < 2048) {t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else {t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function(e) {var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) {r = e.charCodeAt(n); if (r < 128) {t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) {c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else {c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }
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

        // self.join = function(destPeerId){}
        self.msgToSelf = function(srcPeerId, msgId, type, data, path, func, signal){
                signal = (typeof signal !== 'undefined') ? signal : null;

                peer.channelManager.messageHandler({
                        srcPeerId: srcPeerId,
                        msgId: msgId,
                        path: path,
                        type: type,
                        data: data,
                        func: func,
                        signal: signal
                });
        }

        self.findSuccessor = function(destPeerId, id, path, msgId, func, signal){
                ndlog("FIND SUCCESSOR(" + destPeerId +", "+ id +", "+ path +", "+ msgId +", "+ func +", "+ "signal"+ ")");
                if(destPeerId == self.peerId){
                        if(self.peerId == self.successor){
                                self.msgToSelf(self.peerId, msgId, "response", self.peerId, path, func, null);
                        }
                        
                        else if(isBetween(id, self.peerId, self.successor) || id == self.successor){
                                var channel = self.connectorTable[self.successor];
                                path += ","+ self.peerId;
                                ndlog("sending to "+ self.successor);
                                ndlog({srcPeerId: self.peerId, msgId: msgId, path: path, type: "signal-accept", data: "", func: func, signal: signal });

                                channel.send({
                                        srcPeerId: self.peerId,
                                        msgId: msgId,
                                        path: path,
                                        type: "signal-accept",
                                        data: "",
                                        func: func,
                                        signal: signal
                                });
                                // self.msgToSelf(self.peerId, msgId, "response", self.successor, path, func, signal);
                        }
                        
                        else{
                                var node = self.closestPrecedingFinger(id);
                                if( node == self.peerId )
                                        self.findSuccessor(self.successor, id, path, msgId, func, signal); //O(n)
                                else
                                        self.findSuccessor(node, id, path, msgId, func, signal);           //O(log(n))
                        }
                }

                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) ndlog("Connector: "+ channel);
                        path += ","+ self.peerId;

                        ndlog("sending to "+ destPeerId);
                        ndlog({srcPeerId: self.peerId, msgId: msgId, path: path, type: "request", data: "nodeDetails.findSuccessor(" + destPeerId + "," + id + ",\"" + path + "\"," + msgId + ",\"" + func + "\",\'"+ signal+"\')", func: func, signal: signal });
                        channel.send({
                                srcPeerId: self.peerId,
                                msgId: msgId,
                                path: path,
                                type: "request",
                                data: "nodeDetails.findSuccessor(" + destPeerId + "," + id + ",\"" + path + "\"," + msgId + ",\"" + func + "\",\'"+ signal+"\')",
                                func: func,
                                signal: signal
                        });
                }
        }

        self.initFindSuccessor = function(destPeerId, id, path, msgId, func){
                var signalId = new Id().toDec();

                self.channelTable[signalId] = new SimplePeer({
                        initiator: true,
                        trickle: false
                });

                self.channelTable[signalId].on('signal', function(signal) {
                        signal.id = signalId;
                        signal = encodeSignal(signal);
                        self.findSuccessor(destPeerId, id, path, msgId, func, signal);
                });

        }

        self.findPredOfSucc = function(destPeerId, path, msgId, func){
                if( destPeerId == self.peerId) 
                        self.msgToSelf(self.peerId, msgId, "response", self.predecessor, path, func);
                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) ndlog("Connector: "+ channel);
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

        self.initFindPredOfSucc = function(destPeerId, path, msgId, func){

        }

        self.notifyPredecessor = function(destPeerId, data, path, msgId, func){
                if( destPeerId == self.peerId){
                        ndlog("Hello");
                        self.predecessor = data;
                        self.msgToSelf(self.peerId, msgId, "response", null, path, func);
                }
                else{
                        var channel = self.connectorTable[destPeerId];
                        if(channel == null || channel == undefined) ndlog("Connector: "+ channel);
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
                        ndlog("Connector: "+ channel);
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

        function encodeSignal(signal){return Base64.encode(JSON.stringify(signal)); }
        function decodeSignal(signal){return JSON.parse( (Base64.decode(signal)).replace("\n", "\\r\\n") ); }

}