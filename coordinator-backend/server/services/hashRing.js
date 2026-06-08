const crypto = require("crypto");

class HashRing {
  //represents entire hashring
  constructor(nodes = [], vnodes = 150) {
    //each physical node is represented by 150 virtual nodes
    this.ring = new Map();
    this.sortedKeys = [];
    this.vnodes = vnodes;
    nodes.forEach((node) => this.addNode(node));
  }
  addNode(node) {
    const nodeKey = `${node.host}:${node.port}`; //it creates localhost:5000
    for (let i = 0; i < this.vnodes; i++) {
      const hash = this._hash(`${nodeKey}:${node.nodeId}:${i}`);
      this.ring.set(hash, node);
      this.sortedKeys.push(hash);
    }
    this.sortedKeys.sort((a, b) => a - b); //as we need to find the immediate next to the has key value
  }
  removeNode(nodeId) {
    //would be also removing the virtual nodes as well
    const activeNodes = [];
    for (const [hash, node] of this.ring.entries()) {
      //check
      if (node.nodeId != nodeId) {
        if (!activeNodes.some((n) => n.nodeId == node.nodeId)) {
          //it checks whether the node was present previously in the activenodes or not if not the push into activenodes
          activeNodes.push(node);
        }
      }
    }
    this.ring.clear(); //clear everything as fir 150 virtual nodes
    this.sortedKeys = [];
    activeNodes.forEach((node) => this.addNode(node)); //readding of the active nodes after removing the requested node
  }
  getNode(key) {
    if (this.sortedKeys.length === 0) {
      return null;
    }
    const hash = this._hash(key);
    let left = 0;
    let right = this.sortedKeys.length - 1; //Binary Search is running on the sorted virtual-node hash positions stored in sortedKeys.
    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    if (left == this.sortedKeys.length) {
      return this.ring.get(this.sortedKeys[0]); //wrap around circular property so ring implemented
    }
  }
  _hash(str) {
    //string to number
    return parseInt(
      crypto.createHash("md5").update(str).digest("hex").substring(0, 8),
      16,
    );
  }
}
module.exports = new HashRing(); //singleton instance because the entire coordinator sevrice should remain in 1 hashring
