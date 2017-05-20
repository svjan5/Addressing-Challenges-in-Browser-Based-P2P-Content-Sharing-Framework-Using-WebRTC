# Addressing Challenges in Browser Based P2P Content Sharing Framework Using WebRTC

**Implementation of [Paper](http://ieeexplore.ieee.org/document/7474178/) | [Slides](https://github.com/svjan5/DTRM/blob/master/Docs/Presentation.pdf)**

### **Dependencies:**  

- **npm modules:** 
  - **For peer**: bows, dht-id, eventemitter2, simple-pee,  socket.io-client, 
  - **For Boot strap server:** dht-id, hapi, socket.io, config, socket.io-client
  - **Other requirements:** browserify

### Building and executing code:

* **Peer**  (`./peer` )
  * `peer.js` contains the main code for a peer in the asynchronous chord network.
    * `channel-manager.js` and `node-details.js` are its components which it uses to contact with bootstrap server and other peers in the network
  * `browserify main.js > bundle.js`  for compiling changes made to peer code
  * open `createPeer.html` in any web browser (chrome/firefox recommended) for creating a new peer. Open console for getting output and issuing commands to peers.
* **Boot Strap server** (`./bootstrap`)
  * `nodejs  boostrap.js ` for starting the server
