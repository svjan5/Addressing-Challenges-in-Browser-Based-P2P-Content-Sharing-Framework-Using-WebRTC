var ee2 = require('eventemitter2').EventEmitter2;
var io = require('socket.io-client');
var bows = require('bows');
var NodeDetails = require('./node-details.js');
var ChannelManager = require('./channel-manager.js');

log = bows('Bootstrp Server');

exports = module.exports = Peer;

// config: {
//     signalingURL: <IP or Host of webrtp-ring-signaling-bootstrap>
//     logging: defaults to false,
// }
function Peer(config) {
        localStorage.debug = config.logging || false;
        var self = this;
        self.onlineList = [];
        self.events = new ee2({
                wildcard: true,
                newListener: false,
                maxListeners: 20
        });

        // Establish socket io connection with  bootstrap
        var bootConn = io(config.signalingURL + '/');

        // received when peer is ready to use*/
        bootConn.once('connect', function() {
                log('bootstrap connection established');
        });

        /// module api
        self.register = function() {
                bootConn.once('p-registered', function(regData) {
                        self.peerId = regData.peerId;
                        self.events.emit('registered', {
                                peerId: regData.peerId
                        });
                        self.nodeDetails = new NodeDetails(self, self.peerId, regData.n_fingers);
                        self.channelManager = new ChannelManager(self.peerId, bootConn, self.nodeDetails);

                        if (regData.destPeerId != null) {
                                self.channelManager.connect(regData.destPeerId);
                        }
                });

                // Ask bootstrap to register peer
                bootConn.emit('b-register', {});
        };
}