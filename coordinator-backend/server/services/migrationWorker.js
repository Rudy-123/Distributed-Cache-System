const axios = require("axios");

class MigrationWorker {
  async start(hashRing) {
    console.log(`[MIGRATION WORKER] Started background key migration.`);

    //Gather all keys from the old topology masters
    const oldMasters = [];
    for (const [shardId, shard] of hashRing.oldTopologyTable.entries()) {
      if (shard.master) {
        oldMasters.push(shard.master);
      }
    }

    let totalMigrated = 0;

    // Iterate through all old masters to find their keys
    for (const oldMaster of oldMasters) {
      try {
        console.log(
          `[MIGRATION WORKER] Fetching keys from old master ${oldMaster.nodeId}`,
        );
        const response = await axios.get(
          `http://${oldMaster.host}:${oldMaster.port}/keys`,
          { timeout: 5000 },
        );
        const keys = response.data; // Assuming it returns an array of string keys

        if (!Array.isArray(keys)) continue;

        for (const key of keys) {
          const newMaster = hashRing.getNode(key, "WRITE");

          // Does the key belong to a new master now?
          if (newMaster && newMaster.nodeId !== oldMaster.nodeId) {
            try {
              // Fetch the value from the old master
              const oldValRes = await axios.get(
                `http://${oldMaster.host}:${oldMaster.port}/cache/${key}`,
                { timeout: 2000 },
              );

              // We got it. Wait, check if a newer write already hit the new master
              // Actually, if a newer write hit the new master, it would have deleted the old key
              // Since we just fetched it, it means it wasn't overwritten yet.
              const value = oldValRes.data.value;
              let ttl = oldValRes.data.ttl || 0;
              if (oldValRes.data.expires_at > 0) {
                ttl = Math.max(
                  0,
                  Math.ceil(
                    (oldValRes.data.expires_at * 1000 - Date.now()) / 1000,
                  ),
                );
              }

              // Post to the new master
              await axios.post(
                `http://${newMaster.host}:${newMaster.port}/cache`,
                { key, value, ttl },
                { timeout: 2000 },
              );

              // 4. Delete from the old master safely
              await axios.delete(
                `http://${oldMaster.host}:${oldMaster.port}/cache/${key}`,
                { timeout: 2000 },
              );

              totalMigrated++;
            } catch (err) {
              if (err.response && err.response.status === 404) {
                // The old key returned 404. This means a Lazy Read or a fresh Write already moved/deleted it!
                // Perfectly safe, skip.
              } else {
                console.error(
                  `[MIGRATION WORKER] Error migrating key ${key}:`,
                  err.message,
                );
              }
            }
          }
        }
      } catch (err) {
        console.error(
          `[MIGRATION WORKER] Failed to fetch keys from ${oldMaster.nodeId}:`,
          err.message,
        );
      }
    }

    console.log(
      `[MIGRATION WORKER] Finished. Successfully migrated ${totalMigrated} keys.`,
    );

    // We processed all known keys. Give lazy migration a 5-second buffer window
    // to catch any very last-minute in-flight requests, then close migration.
    setTimeout(() => {
      hashRing.endMigration();
    }, 5000);
  }
}

module.exports = new MigrationWorker();
