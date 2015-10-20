var SimplePeer = require('simple-peer');
var Id = require('dht-id');
var bows = require('bows');
var Base64 = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function(e) {
                var t = "";
                var n, r, i, s, o, u, a;
                var f = 0;
                e = Base64._utf8_encode(e);
                while (f < e.length) {
                        n = e.charCodeAt(f++);
                        r = e.charCodeAt(f++);
                        i = e.charCodeAt(f++);
                        s = n >> 2;
                        o = (n & 3) << 4 | r >> 4;
                        u = (r & 15) << 2 | i >> 6;
                        a = i & 63;
                        if (isNaN(r)) {
                                u = a = 64
                        } else if (isNaN(i)) {
                                a = 64
                        }
                        t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
                }
                return t
        },
        decode: function(e) {
                var t = "";
                var n, r, i;
                var s, o, u, a;
                var f = 0;
                e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
                while (f < e.length) {
                        s = this._keyStr.indexOf(e.charAt(f++));
                        o = this._keyStr.indexOf(e.charAt(f++));
                        u = this._keyStr.indexOf(e.charAt(f++));
                        a = this._keyStr.indexOf(e.charAt(f++));
                        n = s << 2 | o >> 4;
                        r = (o & 15) << 4 | u >> 2;
                        i = (u & 3) << 6 | a;
                        t = t + String.fromCharCode(n);
                        if (u != 64) {
                                t = t + String.fromCharCode(r)
                        }
                        if (a != 64) {
                                t = t + String.fromCharCode(i)
                        }
                }
                t = Base64._utf8_decode(t);
                return t
        },
        _utf8_encode: function(e) {
                e = e.replace(/\r\n/g, "\n");
                var t = "";
                for (var n = 0; n < e.length; n++) {
                        var r = e.charCodeAt(n);
                        if (r < 128) {
                                t += String.fromCharCode(r)
                        } else if (r > 127 && r < 2048) {
                                t += String.fromCharCode(r >> 6 | 192);
                                t += String.fromCharCode(r & 63 | 128)
                        } else {
                                t += String.fromCharCode(r >> 12 | 224);
                                t += String.fromCharCode(r >> 6 & 63 | 128);
                                t += String.fromCharCode(r & 63 | 128)
                        }
                }
                return t
        },
        _utf8_decode: function(e) {
                var t = "";
                var n = 0;
                var r = c1 = c2 = 0;
                while (n < e.length) {
                        r = e.charCodeAt(n);
                        if (r < 128) {
                                t += String.fromCharCode(r);
                                n++
                        } else if (r > 191 && r < 224) {
                                c2 = e.charCodeAt(n + 1);
                                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                                n += 2
                        } else {
                                c2 = e.charCodeAt(n + 1);
                                c3 = e.charCodeAt(n + 2);
                                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                                n += 3
                        }
                }
                return t
        }
}

cmlog = bows('Channel Manager');

exports = module.exports = ChannelManager;

function ChannelManager(peerId, bootConn, nodeDetails) {
        var self = this;
        var isStabilize = true;
        var stabilizeData;

        // Establish a connection to another peer
        self.connect = function(destPeerId) {
                cmlog('connecting to: ', destPeerId);

                if (destPeerId == nodeDetails.peerId) {
                        cmlog("Cannot form connection with self");
                        return;
                }

                var intentId = (~~(Math.random() * 1e9)).toString(36) + Date.now();

                var channel = new SimplePeer({
                        initiator: true,
                        trickle: false,
                        reconnectTimer: 1000,
                        config: {
                                iceServers: [{
                                        url: nodeDetails.iceList[nodeDetails.peerId % nodeDetails.iceList.length]
                                }]
                        }
                });

                channel.on('signal', function(signal) {
                        cmlog("Peer1 : Signal generated "); //+ "intentId:"+ intentId + "  srcPeerId:" + peerId + " destPeerId:" + destPeerId );
                        // signal = JSON.parse(JSON.stringify(signal));

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
                                cmlog('Peer1: not right intentId: ', replyData.offer.intentId, intentId);
                                return;
                        }

                        cmlog('Peer1: offerAccepted');

                        // to form direct connection between peers
                        channel.on('ready', function() {
                                cmlog('Peer1 : channel ready to send');

                                nodeDetails.bootPeer.peerId = replyData.offer.destPeerId;
                                nodeDetails.bootPeer.connector = channel;
                                nodeDetails.connectorTable[replyData.offer.destPeerId] = channel;

                                channel.on('message', self.messageHandler);

                                if (!nodeDetails.connected) {
                                        nodeDetails.joinBegTime = (new Date()).getTime();
                                        self.joinNetwork(0, 1);
                                }
                        });

                        channel.signal(replyData.offer.signal);
                });
        };

        bootConn.on('p-forward-offer', function(fwddData) {
                cmlog("Peer2: signal received");
                var channel = new SimplePeer({
                        trickle: false,
                        reconnectTimer: 1000,
                        config: {
                                iceServers: [{
                                        url: nodeDetails.iceList[nodeDetails.peerId % nodeDetails.iceList.length]
                                }]
                        }
                });

                channel.on('ready', function() {
                        cmlog('Peer2 : ready to listen');

                        channel.on('message', self.messageHandler);
                        nodeDetails.bootPeer.peerId = fwddData.offer.srcPeerId;
                        nodeDetails.bootPeer.connector = channel;
                        nodeDetails.connectorTable[fwddData.offer.srcPeerId] = channel;
                        nodeDetails.msgCount++;
                        channel.send({
                                srcPeerId: fwddData.offer.destPeerId,
                                type: "chat-init",
                                data: "how are you?"
                        });
                        // self.joinNetwork(0, null);
                });

                channel.on('signal', function(signal) {
                        cmlog('Peer2 : sending back my signal data');
                        fwddData.offer.signal = signal;
                        bootConn.emit('b-forward-reply', fwddData);
                });


                channel.signal(fwddData.offer.signal);

        });

        bootConn.on('update', function(updateData) {
                if (updateData.isSucc) {
                        cmlog("Updating successor: " + updateData.newConn);
                        delete nodeDetails.connectorTable[nodeDetails.successor];
                        nodeDetails.successor = parseInt(updateData.newConn);
                        if (nodeDetails.connectorTable[nodeDetails.successor] !== 'undefined')
                                self.connect(nodeDetails.successor);
                } else {
                        cmlog("Updating predecessor: " + updateData.newConn);
                        delete nodeDetails.connectorTable[nodeDetails.predecessor];
                        nodeDetails.predecessor = parseInt(updateData.newConn);
                        // if(nodeDetails.connectorTable[nodeDetails.predecessor] !== 'undefined')
                        //         self.connect(nodeDetails.predecessor);
                }
        });

/*
for (var i = 0; i < chord.nodeList.length; i++) {

        0 -> if(i == 0) continue;
        0 -> var node = chord.nodeList[i];
        0 -> node.join(chord.getNode(0));
        1 -> var preceding = node.successor.predecessor;
        2 -> node.stabilize();
        3 -> if(preceding == null) node.successor.stabilize();
        4 -> else preceding.stabilize(); 
};
*/
        self.joinNetwork = function(state, data) {
                switch (state) {

                        case 0:
                                log("JOINING CHORD");
                                /*Join function*/
                                nodeDetails.predecessor = null;
                                /*bootPeer.findSucessor(self.peerId)*/
                                var msgId = new Id().toDec();
                                nodeDetails.responseTable[msgId] = null;

                                nodeDetails.initFindSuccessor(
                                        nodeDetails.bootPeer.peerId,
                                        nodeDetails.peerId,
                                        "",
                                        msgId,
                                        "self.joinNetwork(1," + msgId + ")"
                                );
                                break;

                        case 1:
                                nodeDetails.successor = nodeDetails.responseTable[data];
                                cmlog("Join Network case 0 successful--  Node successor: " + nodeDetails.successor);
                                delete nodeDetails.responseTable[msgId];
                                isStabilize = false;

                        case "stabilize":

                                if (isStabilize) {
                                        cmlog("Stabilize got data:");
                                        cmlog(data);
                                        stabilizeData = data;
                                }

                                var msgId = new Id().toDec();
                                nodeDetails.responseTable[msgId] = null;

                                nodeDetails.initFindPredOfSucc(
                                        nodeDetails.successor,
                                        "",
                                        msgId,
                                        "self.joinNetwork(2," + msgId + ")"
                                );
                                break;

                        case 2:
                                cmlog("Join Network case 1 successful - Predecessor of successor:" + nodeDetails.responseTable[data]);
                                nodeDetails.succPreceding = nodeDetails.responseTable[data];
                                delete nodeDetails.responseTable[msgId];

                                if (nodeDetails.succPreceding != null) {
                                        var key = nodeDetails.succPreceding;
                                        if ((nodeDetails.peerId == nodeDetails.successor) || isBetween(key, nodeDetails.peerId, nodeDetails.successor)) {
                                                nodeDetails.successor = nodeDetails.succPreceding;
                                        }
                                }
                                var func = (!isStabilize) ? "self.joinNetwork(3," + msgId + ")" 
                                						  : "nodeDetails.msgToSelf(" + stabilizeData.srcPeerId + "," + stabilizeData.msgId + ",\\\"" + stabilizeData.type + "\\\"," + stabilizeData.data + ",\\\"" + stabilizeData.path + "\\\",'" + stabilizeData.func + "');";

                                isStabilize = true;
                                var msgId = new Id().toDec();
                                nodeDetails.notifyPredecessor(
                                        nodeDetails.successor,
                                        nodeDetails.peerId,
                                        "",
                                        msgId,
                                        func
                                );
                                break;

                        case 3:
                                cmlog("Join Network case 2 successful");
                                var msgId = new Id().toDec();

                                var callStabilizeOn = (nodeDetails.succPreceding == null) ? nodeDetails.successor : nodeDetails.succPreceding;
                                nodeDetails.stabilize(
                                        callStabilizeOn,
                                        "",
                                        msgId,
                                        "self.joinNetwork(4," + msgId + ")"
                                );
                                break;
                        case 4:
                                cmlog("JOIN NETWORK COMPLETED: \n Successor: " + nodeDetails.successor + "\tPredecessor: " + nodeDetails.predecessor);
                                nodeDetails.connected = true;
                                console.profileEnd();

                                nodeDetails.joinEndTime = (new Date()).getTime() - nodeDetails.joinBegTime;
                                cmlog("-----------------------------------------------------------------------$$$$$$  " + nodeDetails.joinEndTime);
                                // cmlog("-----------------------------------------------------------------------######  " + nodeDetails.msgCount);
                                self.getMsgCount();

                                // setTimeout(function() {
                                //         self.fixAllFingers();
                                // }, 2000);

                                break;
                }
        }

        self.listPeers = function() {
                var channel = nodeDetails.connectorTable[nodeDetails.successor];

                nodeDetails.msgCount++;
                channel.send({
                        srcPeerId: nodeDetails.peerId,
                        data: nodeDetails.peerId,
                        type: "listPeers"
                });

                cmlog(channel);
                cmlog({
                        srcPeerId: nodeDetails.peerId,
                        data: nodeDetails.peerId,
                        type: "listPeers"
                });
        }

        self.getMsgCount = function() {
                var channel = nodeDetails.connectorTable[nodeDetails.successor];

                channel.send({
                        srcPeerId: nodeDetails.peerId,
                        data: 0,
                        type: "msgCount"
                });

                cmlog(channel);
                cmlog({
                        srcPeerId: nodeDetails.peerId,
                        data: 0,
                        type: "msgCount"
                });
        }

        self.fixAllFingers = function() {
                var channel = nodeDetails.connectorTable[nodeDetails.successor];

                channel.send({
                        srcPeerId: nodeDetails.peerId,
                        type: "fixfingers"
                });

                cmlog(channel);
                cmlog({
                        srcPeerId: nodeDetails.peerId,
                        type: "fixfingers"
                });
        }

        self.checkConnection = function(peerId) {
                nodeDetails.msgCount++;
                try {
                        nodeDetails.connectorTable[peerId].send();
                } catch (err) {
                        return false;
                }
                return true;
        }

        self.channel = null;

        self.messageHandler = function(message) {
                switch (message.type) {

                        case "chat-init":
                                var channel = nodeDetails.connectorTable[message.srcPeerId];
                                cmlog(message);
                                nodeDetails.msgCount++;
                                channel.send({
                                        srcPeerId: peerId,
                                        type: "chat-ack",
                                        data: "I am fine"
                                });
                                break;

                        case "chat-ack":
                                cmlog(message);
                                break;

                        case "request":
                                cmlog("Request Received");
                                cmlog(message);
                                cmlog("Executing :");
                                var data = eval(message.data);
                                break;

                        case "response":
                                cmlog("In response");
                                cmlog(message);
                                var path = message.path.split(",");

                                if (path.length == 1) {
                                        cmlog("Message for self");
                                        var conId = parseInt(message.data);
                                        nodeDetails.responseTable[message.msgId] = message.data;

                                        // cmlog(message.signal);

                                        if ((typeof nodeDetails.connectorTable[conId] === 'undefined') && (message.signal != null)) {
                                                if (conId == nodeDetails.peerId) {
                                                        cmlog("Cannot with connection with self");
                                                        eval(message.func);
                                                        return;
                                                }

                                                cmlog("Form connection with " + conId);
                                                decSig = self.decodeSignal(message.signal);

                                                nodeDetails.channelTable[decSig.id].on('ready', function() {
                                                        cmlog('Connected to ' + conId);
                                                        nodeDetails.connectorTable[conId] = nodeDetails.channelTable[decSig.id];
                                                        eval(message.func);
                                                        nodeDetails.channelTable[decSig.id].on('message', self.messageHandler);
                                                });

                                                nodeDetails.channelTable[decSig.id].signal(decSig);
                                        } else {
                                                cmlog("Connection already exists with " + conId);
                                                cmlog("Executing :" + message.func);
                                                eval(message.func);
                                        }
                                } else {
                                        var returnPeerId = parseInt(path.pop(), 10);
                                        cmlog("Forward to " + returnPeerId);
                                        message.path = path.join();
                                        var channel = nodeDetails.connectorTable[returnPeerId];
                                        nodeDetails.msgCount++;
                                        channel.send(message);
                                }
                                break;


                        case "signal-accept":
                                cmlog("In signal-accept:")
                                cmlog(message);
                                decSig = self.decodeSignal(message.signal);

                                cmlog("decSig:");
                                cmlog(decSig);

                                nodeDetails.channelTable[decSig.id] = new SimplePeer({
                                        trickle: false,
                                        reconnectTimer: 1000,
                                        config: {
                                                iceServers: [{
                                                        url: nodeDetails.iceList[nodeDetails.peerId % nodeDetails.iceList.length]
                                                }]
                                        }
                                });

                                nodeDetails.channelTable[decSig.id].on('signal', function(signal) {
                                        cmlog('signal-accept: signal -- Peer2 : sending back my signal data');

                                        message.signal = signal;
                                        message.signal.id = decSig.id;
                                        message.signal = self.encodeSignal(message.signal);

                                        // cmlog("After : " + message.signal);

                                        message.data = nodeDetails.peerId;
                                        nodeDetails.msgToSelf(message.srcPeerId, message.msgId, "response", message.data, message.path, message.func, message.signal);
                                });

                                nodeDetails.channelTable[decSig.id].on('ready', function() {
                                        cmlog("signal-accept :ready")

                                        var conId = parseInt(message.path.split(",")[1]);
                                        nodeDetails.connectorTable[conId] = nodeDetails.channelTable[decSig.id];
                                        nodeDetails.channelTable[decSig.id].on('message', self.messageHandler);
                                        cmlog("Connected to " + message.srcPeerId);
                                });

                                // cmlog("Before : " + message.signal);
                                nodeDetails.channelTable[decSig.id].signal(decSig);
                                break;


                        case "listPeers":
                                cmlog(message);
                                /*Get list*/
                                if (message.srcPeerId == nodeDetails.peerId) {
                                        cmlog("LIST OF PEERS IN NETWORK: " + message.data);
                                }
                                /*forward*/
                                else {
                                        var channel = nodeDetails.connectorTable[nodeDetails.successor];
                                        message.data += ", " + nodeDetails.peerId;
                                        cmlog("Forward" + message);
                                        nodeDetails.msgCount++;
                                        channel.send(message);
                                }
                                break;

                        case "msgCount":
                                cmlog(message);
                                /*Get list*/
                                if (message.srcPeerId == nodeDetails.peerId) {
                                        cmlog("--------------------------------################## Messages exchanged: " + message.data);
                                        nodeDetails.msgCount = 0;
                                }
                                /*forward*/
                                else {
                                        var channel = nodeDetails.connectorTable[nodeDetails.successor];
                                        message.data = message.data + nodeDetails.msgCount;
                                        nodeDetails.msgCount = 0;
                                        cmlog("Forward msgCount"); cmlog(message);
                                        channel.send(message);
                                }
                                break;

                        case "fixfingers":
                                cmlog(message);
                                /*Get list*/
                                if (message.srcPeerId == nodeDetails.peerId) {
                                        nodeDetails.fixFingers(0, null);
                                        cmlog("Fixed all fingers");
                                }
                                /*forward*/
                                else {
                                        nodeDetails.fixFingers(0, message.srcPeerId);
                                }
                                break;

                }
        }

        /* peerId <belongs to> (fromKey,toKey) exclusive*/
        function isBetween(peerId, fromKey, toKey) {
                if (fromKey > toKey) return (peerId > fromKey || peerId < toKey);
                else return (peerId > fromKey && peerId < toKey);
        }
        self.encodeSignal = function(signal) {
                pack = {
                        id: signal.id,
                        sig: signal
                };
                return Base64.encode(JSON.stringify(pack));
        }
        self.decodeSignal = function(signal) {
                pack = JSON.parse(Base64.decode(signal).replace("\n", "\\r\\n"))
                pack.sig.id = pack.id;
                return pack.sig;
        }
}