const crypto = require("crypto");

class HashRing {
  //represents entire hashring
  constructor(nodes = []) {
    // Fixed token architecture: exactly 1 token per shard
    this.ring = new Map(); // hash -> shardId
    this.sortedKeys = [];
    this.topologyTable = new Map(); // shardId -> { master: node, replicas: [nodes] }
    nodes.forEach((node) => this.addNode(node));
  }

  _rebuildRing() {
    this.ring.clear();
    this.sortedKeys = [];
    const activeShards = Array.from(this.topologyTable.keys());
    activeShards.sort((a, b) => {
      const numA = parseInt(a.split("-")[1] || 0);
      const numB = parseInt(b.split("-")[1] || 0);
      return numA - numB;
    }); // Ensure stable numeric ordering like shard-2, shard-10

    const totalShards = activeShards.length;
    activeShards.forEach((id, index) => {
      const shardIndex = index + 1;
      const hash = Math.floor((shardIndex / totalShards) * 1000000);
      this.ring.set(hash, id);
      this.sortedKeys.push(hash);
    });
    this.sortedKeys.sort((a, b) => a - b);
  }

  addNode(node) {
    const shardId = node.shardId || "shard-1";

    // Initialize shard topology if it doesn't exist
    if (!this.topologyTable.has(shardId)) {
      this.topologyTable.set(shardId, { master: null, replicas: [], readPool: [] });
      this._rebuildRing();
    }

    // Update topology
    const shard = this.topologyTable.get(shardId);
    if (node.role === "master") {
      shard.master = node;
    } else if (node.role === "replica") {
      const existingIdx = shard.replicas.findIndex((n) => n.nodeId === node.nodeId);
      if (existingIdx !== -1) {
        shard.replicas[existingIdx] = node; // Update existing replica
      } else {
        shard.replicas.push(node);
      }
    }
    
    this._rebuildReadPool(shardId);
  }

  _rebuildReadPool(shardId) {
    const shard = this.topologyTable.get(shardId);
    if (!shard) return;

    const freshReplicas = shard.replicas.filter((r) => r.replicationLag < 50);
    shard.readPool = [shard.master, ...freshReplicas].filter(Boolean);

    // Fallback: If all replicas are lagging and master is down, use any replica
    if (shard.readPool.length === 0 && shard.replicas.length > 0) {
      shard.readPool = [...shard.replicas];
    }
  }

  removeNode(nodeId) {
    for (const [shardId, shard] of this.topologyTable.entries()) {
      if (shard.master && shard.master.nodeId === nodeId) {
        shard.master = null;
      }
      shard.replicas = shard.replicas.filter((n) => n.nodeId !== nodeId);

      // Remove shard entirely if it has no nodes left
      if (!shard.master && shard.replicas.length === 0) {
        this._removeShard(shardId);
      } else {
        this._rebuildReadPool(shardId);
      }
    }
  }

  _removeShard(shardId) {
    this.topologyTable.delete(shardId);
    this._rebuildRing();
  }

  getNode(key, operation = "READ") {
    if (this.sortedKeys.length === 0) {
      return null;
    }
    const hash = this._hash(key);
    let left = 0;
    let right = this.sortedKeys.length - 1; //Binary Search
    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      if (this.sortedKeys[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    if (left == this.sortedKeys.length) {
      left = 0; //wrap around circular property
    }

    const shardId = this.ring.get(this.sortedKeys[left]);
    const shard = this.topologyTable.get(shardId);
    if (!shard) return null;

    if (operation === "WRITE") {
      return shard.master; // Only master can accept writes
    } else {
      // O(1) read routing using precomputed pool
      if (!shard.readPool || shard.readPool.length === 0) return null;
      const randomIdx = Math.floor(Math.random() * shard.readPool.length);
      return shard.readPool[randomIdx];
    }
  }

  _hash(str) {
    //string to number, limited to max 1000000 for better scalability (1 to 1000000)
    return (
      (parseInt(
        crypto.createHash("md5").update(str).digest("hex").substring(0, 8),
        16,
      ) %
        1000000) +
      1
    );
  }
}
module.exports = new HashRing(); //singleton instance because the entire coordinator sevrice should remain in 1 hashring
