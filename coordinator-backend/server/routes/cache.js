const express = require("express");
const router = express.Router();
const axios = require("axios");
const http = require("http");
// Enable Keep-Alive globally for Axios with maxSockets to prevent C++ Thread Pool Exhaustion
axios.defaults.httpAgent = new http.Agent({ keepAlive: true, maxSockets: 4, maxFreeSockets: 4 });
const hashRing = require("../services/hashRing"); //hashring service
const AccessLog = require("../models/AccessLog");
const { protect } = require("../middleware/auth"); //jwt auth middleware

router.post("/", /*protect,*/ async (req, res) => {
  //client want to save the data on the cache
  const { key, value, ttl } = req.body;
  if (!key || !value) {
    return res.status(400).json({ error: "Key and Value are reuqired" });
  }
  const start = Date.now(); //use this further
  let targetNode = hashRing.getNode(key, "WRITE"); //hashes the key and looks at the ring to decide which node would store it
  if (!targetNode) {
    console.log(
      `[HASH RING FALLBACK] Ring was empty. Dynamically fetching healthy master nodes from DB...`,
    );
    const NodeConfig = require("../models/NodeConfig");
    const healthyMasters = await NodeConfig.find({
      role: "master",
      status: "healthy",
    });
    healthyMasters.forEach((n) => hashRing.addNode(n));
    targetNode = hashRing.getNode(key, "WRITE");
  }
  let retries = 1;
  let success = false;
  let lastError = null;

  while (retries >= 0 && !success) {
    if (!targetNode) {
      return res
        .status(503)
        .json({ error: "No healthy cache nodes available" });
    }

    try {
      const url = `http://${targetNode.host}:${targetNode.port}/cache`;
      const response = await axios.post(
        url,
        { key, value, ttl },
        { timeout: 2000 },
      );
      AccessLog.create({
        userId: req.user?._id,
        action: "SET",
        key,
        nodeId: targetNode.nodeId,
        responseTimeMs: Date.now() - start, //for the latency
        statusCode: response.status,
      }).catch(e => {}); // fire-and-forget
      res.json({ ...response.data, routed_to: targetNode.nodeId });
      success = true;

      // [MIGRATION STALE COPY DELETION]
      if (hashRing.isMigrating) {
        const oldTarget = hashRing.getOldNode(key, "WRITE");
        if (oldTarget && oldTarget.nodeId !== targetNode.nodeId) {
          // Fire and forget delete on old shard
          axios
            .delete(`http://${oldTarget.host}:${oldTarget.port}/cache/${key}`, {
              timeout: 2000,
            })
            .catch((e) => {
              console.error(
                `[MIGRATION] Failed to delete stale key ${key} from old shard ${oldTarget.nodeId}:`,
                e.message,
              );
            });
        }
      }
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 421 || err.response.status === 301) &&
        retries > 0
      ) {
        console.log(
          `[REDIRECT] Node ${targetNode.nodeId} is no longer master. Re-fetching topology and retrying...`,
        );
        const NodeConfig = require("../models/NodeConfig");
        const healthyMaster = await NodeConfig.findOne({
          role: "master",
          status: "healthy",
          shardId: targetNode.shardId || "shard-1",
        });
        if (healthyMaster) {
          hashRing.addNode(healthyMaster);
          targetNode = hashRing.getNode(key, "WRITE"); // Re-evaluate target
        }
        retries--;
      } else {
        lastError = err;
        break;
      }
    }
  }

  if (!success) {
    res.status(500).json({
      error: `Node ${targetNode ? targetNode.nodeId : "unknown"} failed: ${lastError.message}`,
    });
  }
});

router.get("/:key", /*protect,*/ async (req, res) => {
  //get specific item
  const { key } = req.params;
  const start = Date.now();
  let targetNode = hashRing.getNode(key, "READ");
  if (!targetNode) {
    console.log(
      `[HASH RING FALLBACK] Ring was empty. Dynamically fetching healthy master nodes from DB...`,
    );
    const NodeConfig = require("../models/NodeConfig");
    const healthyMasters = await NodeConfig.find({
      role: "master",
      status: "healthy",
    });
    healthyMasters.forEach((n) => hashRing.addNode(n));
    targetNode = hashRing.getNode(key, "READ");
  }
  if (!targetNode) {
    return res.status(503).json({ error: "No healthy cache nodes avalable" });
  }
  try {
    const url = `http://${targetNode.host}:${targetNode.port}/cache/${key}`;
    const response = await axios.get(url, { timeout: 2000 });
    AccessLog.create({
      userId: req.user?._id,
      action: "GET",
      key,
      nodeId: targetNode.nodeId,
      responseTimeMs: Date.now() - start,
      statusCode: response.status,
    }).catch(e => {}); // fire-and-forget
    return res.json({ ...response.data, routed_to: targetNode.nodeId });
  } catch (err) {
    // [LAZY READ MIGRATION]
    if (err.response && err.response.status === 404 && hashRing.isMigrating) {
      const oldTarget = hashRing.getOldNode(key, "READ");
      if (oldTarget && oldTarget.nodeId !== targetNode.nodeId) {
        console.log(
          `[MIGRATION] Key ${key} not on new shard. Lazy fetching from old shard ${oldTarget.nodeId}`,
        );
        try {
          const oldUrl = `http://${oldTarget.host}:${oldTarget.port}/cache/${key}`;
          const oldResponse = await axios.get(oldUrl, { timeout: 2000 });

          AccessLog.create({
            userId: req.user?._id,
            action: "GET",
            key,
            nodeId: oldTarget.nodeId,
            responseTimeMs: Date.now() - start,
            statusCode: oldResponse.status,
          }).catch(e => {}); // fire-and-forget
          res.json({
            ...oldResponse.data,
            routed_to: oldTarget.nodeId,
            migrated: true,
          });

          // Fire-and-forget migration!
          setImmediate(async () => {
            const writeTarget = hashRing.getNode(key, "WRITE");
            if (!writeTarget) return;
            try {
              const value = oldResponse.data.value;
              let ttl = oldResponse.data.ttl || 0;
              if (oldResponse.data.expires_at > 0) {
                ttl = Math.max(
                  0,
                  Math.ceil(
                    (oldResponse.data.expires_at * 1000 - Date.now()) / 1000,
                  ),
                );
              }
              await axios.post(
                `http://${writeTarget.host}:${writeTarget.port}/cache`,
                { key, value, ttl },
                { timeout: 2000 },
              );
              const oldWriteTarget = hashRing.getOldNode(key, "WRITE");
              if (oldWriteTarget) {
                await axios.delete(
                  `http://${oldWriteTarget.host}:${oldWriteTarget.port}/cache/${key}`,
                  { timeout: 2000 },
                );
                console.log(
                  `[MIGRATION] Lazy migrated key ${key} from ${oldWriteTarget.nodeId} to ${writeTarget.nodeId}`,
                );
              }
            } catch (migErr) {
              console.error(
                `[MIGRATION] Background lazy migration failed for key ${key}:`,
                migErr.message,
              );
            }
          });
          return;
        } catch (oldErr) {
          const status = oldErr.response ? oldErr.response.status : 500;
          return res.status(status).json({
            status: "miss",
            error: `Node ${oldTarget.nodeId} lookup failed: ${oldErr.message}`,
          });
        }
      }
    }

    const status = err.response ? err.response.status : 500;
    res.status(status).json({
      status: "miss",
      error: `Node ${targetNode.nodeId} lookup failed: ${err.message}`,
    });
  }
});

router.delete("/:key", /*protect,*/ async (req, res) => {
  const { key } = req.params;
  const start = Date.now();
  let targetNode = hashRing.getNode(key, "WRITE");
  if (!targetNode) {
    console.log(
      `[HASH RING FALLBACK] Ring was empty. Dynamically fetching healthy master nodes from DB...`,
    );
    const NodeConfig = require("../models/NodeConfig");
    const healthyMasters = await NodeConfig.find({
      role: "master",
      status: "healthy",
    });
    healthyMasters.forEach((n) => hashRing.addNode(n));
    targetNode = hashRing.getNode(key, "WRITE");
  }
  let retries = 1;
  let success = false;
  let lastError = null;

  while (retries >= 0 && !success) {
    if (!targetNode) {
      return res
        .status(503)
        .json({ error: "No healthy cache nodes available" });
    }

    try {
      const url = `http://${targetNode.host}:${targetNode.port}/cache/${key}`;
      const response = await axios.delete(url, { timeout: 2000 });
      AccessLog.create({
        userId: req.user?._id,
        action: "DELETE",
        key,
        nodeId: targetNode.nodeId,
        responseTimeMs: Date.now() - start,
        statusCode: response.status,
      }).catch(e => {}); // fire-and-forget
      res.json(response.data);
      success = true;

      // [MIGRATION DOUBLE DELETION]
      if (hashRing.isMigrating) {
        const oldTarget = hashRing.getOldNode(key, "WRITE");
        if (oldTarget && oldTarget.nodeId !== targetNode.nodeId) {
          axios
            .delete(`http://${oldTarget.host}:${oldTarget.port}/cache/${key}`, {
              timeout: 2000,
            })
            .catch((e) => {
              console.error(
                `[MIGRATION] Failed to delete migrating key ${key} from old shard ${oldTarget.nodeId}:`,
                e.message,
              );
            });
        }
      }
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 421 || err.response.status === 301) &&
        retries > 0
      ) {
        console.log(
          `[REDIRECT] Node ${targetNode.nodeId} is no longer master. Re-fetching topology and retrying...`,
        );
        const NodeConfig = require("../models/NodeConfig");
        const healthyMaster = await NodeConfig.findOne({
          role: "master",
          status: "healthy",
          shardId: targetNode.shardId || "shard-1",
        });
        if (healthyMaster) {
          hashRing.addNode(healthyMaster);
          targetNode = hashRing.getNode(key, "WRITE"); // Re-evaluate target
        }
        retries--;
      } else {
        lastError = err;
        break;
      }
    }
  }

  if (!success) {
    res.status(500).json({ error: lastError.message });
  }
});
module.exports = router;
