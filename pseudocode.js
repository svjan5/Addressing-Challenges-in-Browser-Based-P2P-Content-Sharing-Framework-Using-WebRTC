
SYNCHRONOUS
JoinNetwork()
        n.predecessor = null;
        n.successor = b.findSuccessor(n.peerId);
        n.succPred = n.successor.getPredecessor();
        n.stabilize();
        if n.succPred == null
                n.successor.stabilize();
        else
                n.succPred.stabilize();

ASYNCHRONOUS
JoinNetwork(state, data)
        state 0:
                n.predecessor = null;
                msgId = responseTable.new();
                n.initFindSuccessor(b.peerId, n.peerId, msgId, "next state")
        state 1:
                n.successor = responseTable.get(msgId);
                msgId = responseTable.new();
                n.initFindPredOfSucc(n.successor, msgId, "next state")
        state 2:
                n.succPred = responseTable.get(msgId);
                if n.succPred != null AND n.succPred ∈ (n.peerId, n.successor]
                        n.successor = n.succPred;
                n.notifyPredecessor(n.successor, n.peerId, msgId, "next state");
        state 3:
                if n.succPred == null
                        n.stabilize(n.successor, msgId, "next state");
                else
                        n.stabilize(n.succPred, msgId, "next state");




initFindSuccessor(destPeerId, id, msgId, func)
        signal = generateSignal(initiator = true)
        findSucessor(destPeerId, id, path, msgId, func, signal)


findSucessor(destPeerId, id, path, msgId, func)
        if destPeerId == n.peerId
                if n.peerId == n.successor
                        exec(func);
                else if id ∈ (n.peerId, n.successor]
                        n.successor.acceptSignal()
                else
                        if n.closestPredecedingFinger(id) == n.peerId
                                n.findSucessor(n.successor, id, path, msgId, func, signal);
                        else
                                n.findSucessor(n.closestPredecedingFinger(id), id, path, msgId, func);
        else
                path.append(n.peerId)
                destPeerId.findSucessor(destPeerId, id, path, msgId, func, signal);

initFindPredOfSucc(destPeerId, path, msgId, func)
        signal = generateSignal(initiator = true)
        findPredOfSucc(destPeerId, path, msgId, func, signal)

findPredOfSucc(destPeerId, path, msgId, func, signal)
        if destPeerId == n.peerId
                if n.peerId == n.successor
                        exec(func)
                else
                        n.predecessor.acceptSignal()
        else
                destPeerId.findPredOfSucc(destPeerId, path, msgId, func, signal)

notifyPredecessor(destPeerId, data, path, msgId, func)
        if destPeerId == n.peerId
                n.predecessor = data
                exec(func)
        else
                destPeerId.notifyPredecessor(destPeerId, data, path, msgId, func)

stabilize(destPeerId, path, msgId, func)
        if destPeerId == n.peerId
                n.succPred = n.initFindPredOfSucc(n.successor, msgId, "next state")
                if n.succPred == null AND n.succPred ∈ (n.peerId, n.successor]
                        n.successor = n.succPred
                n.notifyPredecessor(n.successor, n.peerId, msgId, "next state")

        else
                destPeerId.stabilize(destPeerId, path, msgId, func)

fixFinger()
        for each finger : fingerTable
                msgId = responseTable.new();
                n.initFindSuccessor(n.peerId, finger.start, msgId, "update entry")
                // finger.node = responseTable.get(msgId);


Server Operation:
peerJoin()
        generate_PeerId();
        send_address_boot_peer();
forwardOffer()
forwardReply()
peerLeave()

newPeer connection sequence:
newPeer-sends signal data to Server

np.send(bs, signal)


