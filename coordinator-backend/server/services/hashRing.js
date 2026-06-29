const crypto = require("crypto");
const migrationWorker = require("./migrationWorker"); // We will create this

class HashRing {
  constructor(nodes = []) {
    this.ring = new Map(); // hash -> shardId
    this.sortedKeys = [];
    this.topologyTable = new Map(); // shardId -> { master: node, replicas: [nodes] }

    // Migration State
    this.isMigrating = false;
    this.oldRing = new Map();
    this.oldSortedKeys = [];
    this.oldTopologyTable = new Map();
    this.migrationQueue = [];

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
    });

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

    if (!this.topologyTable.has(shardId)) {
      // New shard addition! Check if we are already migrating.
      if (this.isMigrating) {
        console.log(
          `[MIGRATION] Ring is currently migrating. Queuing addition of node ${node.nodeId} for ${shardId}`,
        );
        this.migrationQueue.push(node);
        return;
      }
      // Start migration
      this._startMigration();
      this.topologyTable.set(shardId, {
        master: null,
        replicas: [],
        readPool: [],
      });
      this._rebuildRing();

      // Kick off background worker
      setTimeout(() => migrationWorker.start(this), 100);
    }

    const shard = this.topologyTable.get(shardId);
    if (node.role === "master") {
      shard.master = node;
    } else if (node.role === "replica") {
      const existingIdx = shard.replicas.findIndex(
        (n) => n.nodeId === node.nodeId,
      );
      if (existingIdx !== -1) {
        shard.replicas[existingIdx] = node;
      } else {
        shard.replicas.push(node);
      }
    }

    this._rebuildReadPool(shardId);

    // If we have an old topology table, update it too so reads hitting old ring still get routed properly
    if (this.isMigrating && this.oldTopologyTable.has(shardId)) {
      const oldShard = this.oldTopologyTable.get(shardId);
      if (node.role === "master") oldShard.master = node;
      else {
        const eIdx = oldShard.replicas.findIndex(
          (n) => n.nodeId === node.nodeId,
        );
        if (eIdx !== -1) oldShard.replicas[eIdx] = node;
        else oldShard.replicas.push(node);
      }
      // Rebuild old read pool inline
      const fresh = oldShard.replicas.filter((r) => r.replicationLag < 50);
      oldShard.readPool = [oldShard.master, ...fresh].filter(Boolean);
      if (oldShard.readPool.length === 0 && oldShard.replicas.length > 0)
        oldShard.readPool = [...oldShard.replicas];
    }
  }

  _startMigration() {
    if (this.topologyTable.size === 0) return; // Don't migrate on the very first shard
    console.log(
      `[MIGRATION] Starting migration mode. Cloning current ring to oldRing.`,
    );
    this.isMigrating = true;
    this.oldRing = new Map(this.ring);
    this.oldSortedKeys = [...this.sortedKeys];
    // Deep clone topology table just enough for routing
    this.oldTopologyTable = new Map();
    for (const [sId, shard] of this.topologyTable.entries()) {
      this.oldTopologyTable.set(sId, {
        master: shard.master,
        replicas: [...shard.replicas],
        readPool: [...shard.readPool],
      });
    }
  }

  endMigration() {
    console.log(`[MIGRATION] Migration finished. Discarding oldRing.`);
    this.isMigrating = false;
    this.oldRing.clear();
    this.oldSortedKeys = [];
    this.oldTopologyTable.clear();

    if (this.migrationQueue.length > 0) {
      const nextNode = this.migrationQueue.shift();
      console.log(
        `[MIGRATION] Processing queued node addition: ${nextNode.nodeId}`,
      );
      this.addNode(nextNode);
    }
  }

  _rebuildReadPool(shardId) {
    const shard = this.topologyTable.get(shardId);
    if (!shard) return;

    const freshReplicas = shard.replicas.filter((r) => r.replicationLag < 50);
    shard.readPool = [shard.master, ...freshReplicas].filter(Boolean);

    if (shard.readPool.length === 0 && shard.replicas.length > 0) {
      shard.readPool = [...shard.replicas];
    }
  }

  removeNode(nodeId) {
    for (const [shardId, shard] of this.topologyTable.entries()) {
      if (shard.master && shard.master.nodeId === nodeId) shard.master = null;
      shard.replicas = shard.replicas.filter((n) => n.nodeId !== nodeId);

      if (!shard.master && shard.replicas.length === 0) {
        this._removeShard(shardId);
      } else {
        this._rebuildReadPool(shardId);
      }
    }
  }

  _removeShard(shardId) {
    if (this.isMigrating) {
      // Removing a shard during migration is extremely dangerous.
      // We will forcefully end migration to avoid corruption.
      this.isMigrating = false;
    }
    this.topologyTable.delete(shardId);
    this._rebuildRing();
  }

  getNode(key, operation = "READ") {
    return this._getNodeFromState(
      key,
      operation,
      this.ring,
      this.sortedKeys,
      this.topologyTable,
    );
  }

  getOldNode(key, operation = "READ") {
    if (!this.isMigrating) return null;
    return this._getNodeFromState(
      key,
      operation,
      this.oldRing,
      this.oldSortedKeys,
      this.oldTopologyTable,
    );
  }

  _getNodeFromState(key, operation, ringMap, sortedKeysArr, topologyMap) {
    if (sortedKeysArr.length === 0) return null;
    const hash = this._hash(key);
    let left = 0;
    let right = sortedKeysArr.length - 1;
    while (left <= right) {
      let mid = Math.floor((left + right) / 2);
      if (sortedKeysArr[mid] < hash) left = mid + 1;
      else right = mid - 1;
    }
    if (left == sortedKeysArr.length) left = 0;

    const shardId = ringMap.get(sortedKeysArr[left]);
    const shard = topologyMap.get(shardId);
    if (!shard) return null;

    if (operation === "WRITE") {
      return shard.master;
    } else {
      if (!shard.readPool || shard.readPool.length === 0) return null;
      const randomIdx = Math.floor(Math.random() * shard.readPool.length);
      return shard.readPool[randomIdx];
    }
  }

  _hash(str) {
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
module.exports = new HashRing();
