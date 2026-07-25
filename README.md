High-Performance Distributed Cache System

Concurrent C++ Cache Engine with Replication, Sharding, Failover, Online Migration, and Real-Time Monitoring

📖 Project Overview

Distributed Cache System is an engineering prototype that explores the design and implementation of a distributed in-memory key-value cache.

The project combines:

a concurrent C++20 cache engine,

a Node.js/Express coordinator for routing and cluster management,

MongoDB-backed cluster metadata,

a React monitoring dashboard,

and Docker Compose for multi-service execution.

The system is organised into shards. Each shard contains one primary node and one or more replicas. The coordinator hashes incoming keys, routes writes to the shard primary, distributes reads across an eligible read pool, monitors node health, and initiates replica promotion when a primary becomes unavailable.

The implementation also supports online shard expansion through old/new routing topologies, background key migration, TTL preservation, and lazy-read fallback.

Project status: This repository is a detailed distributed-systems prototype created for learning, experimentation, and validation of caching, replication, routing, migration, and failure-management mechanisms. It is not intended to be a production-ready replacement for Redis.

✨ Core Features

C++20 Cache Engine

Average O(1) key indexing for GET, SET, and DELETE using std::unordered_map

Doubly linked list for access-order tracking

LRFU-inspired eviction that combines recency and access-frequency information

Ordered TTL scheduling with O(log N) expiration insertion/removal

Lazy expiration during reads and active cleanup through a background worker

Mutex-protected access to shared cache state

Cache statistics for hits, misses, writes, deletions, and evictions

HTTP/JSON endpoints for cache and cluster operations

Replication and Failure Handling

Primary-replica shard topology

Quorum-acknowledged SET replication

Thread-safe peer registration and health-state management

Periodic node health checks

Node failure confirmation after repeated missed heartbeats

Automatic replica promotion

Promotion candidates prioritised by replication offset and uptime

Coordinator retry handling after topology or primary-role changes

Sharding and Online Expansion

Deterministic key hashing

O(log S) shard lookup through binary search over sorted shard positions

Writes routed to the shard primary

O(1) node selection from a prefiltered read pool

Read pools include the primary and eligible replicas within the configured health-latency threshold

Old and new routing topologies maintained during shard expansion

Background migration of only the keys whose destination changes

Remaining TTL preserved while moving keys

Lazy-read fallback for keys not yet migrated

Stale-copy cleanup after successful migration

Coordinator and Monitoring

Node.js and Express API coordinator

MongoDB-backed node configuration, cluster metadata, and operation logs

HTTP keep-alive and connection pooling for cache-node requests

Socket.IO events for:

node-health updates,

throughput and latency metrics,

topology changes,

and failover notifications

React dashboard for cluster visibility and management

Testing and Deployment

Unit tests for core cache operations, eviction, TTL expiration, and concurrent access

Configurable multithreaded throughput benchmark

Successful/failed operation counters and operations-per-second reporting

Docker and Docker Compose configuration for running the complete system

⚙️ Complexity Summary

Let:

N = number of entries inside a cache node

S = number of shards

K = number of keys evaluated during migration

Operation

Complexity

Implementation

Cache key lookup

Average O(1)

std::unordered_map

Cache insertion/update

Average O(1), excluding TTL scheduling

Hash-map indexing

Cache deletion

Average O(1), excluding TTL removal

Hash-map + list iterator

TTL scheduling

O(log N)

Ordered expiration structure

Shard lookup

O(log S)

Binary search over sorted shard positions

Read-node selection

O(1)

Random selection from a prebuilt eligible pool

Ring rebuild

O(S log S)

Rebuilding and sorting shard positions

Key migration

Approximately O(K log S)

Rehashing keys against the updated ring

Shard addition is therefore not treated as a single O(log N) operation. It includes rebuilding routing metadata and migrating the affected keys.

🏗️ System Architecture

flowchart TD
    classDef client fill:#f3e5f5,stroke:#4a148c,stroke-width:2px,color:#000;
    classDef frontend fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px,color:#000;
    classDef coordinator fill:#fff8e1,stroke:#e65100,stroke-width:2px,color:#000;
    classDef metadata fill:#f5f5f5,stroke:#424242,stroke-width:2px,color:#000;
    classDef primary fill:#ffebee,stroke:#b71c1c,stroke-width:2px,color:#000;
    classDef replica fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000;

    Client((Client / User)):::client
    Dashboard[React Dashboard<br/>Cluster Monitoring]:::frontend
    Coordinator[Node.js / Express Coordinator<br/>Routing · Health · Failover · Migration]:::coordinator
    MongoDB[(MongoDB<br/>Cluster Metadata & Logs)]:::metadata

    subgraph CacheGrid["C++20 Distributed Cache Grid"]
        direction LR

        subgraph Shard1["Shard 1"]
            P1[Primary 1]:::primary
            R11[Replica 1A]:::replica
            R12[Replica 1B]:::replica
        end

        subgraph Shard2["Shard 2"]
            P2[Primary 2]:::primary
            R21[Replica 2A]:::replica
            R22[Replica 2B]:::replica
        end
    end

    Client --> Coordinator
    Dashboard <--> Coordinator
    Coordinator <--> MongoDB

    Coordinator -->|Writes| P1
    Coordinator -->|Writes| P2

    Coordinator -.->|Reads from eligible pool| P1
    Coordinator -.->|Reads from eligible pool| R11
    Coordinator -.->|Reads from eligible pool| R12
    Coordinator -.->|Reads from eligible pool| P2
    Coordinator -.->|Reads from eligible pool| R21
    Coordinator -.->|Reads from eligible pool| R22

    P1 -->|Quorum-acknowledged replication| R11
    P1 -->|Quorum-acknowledged replication| R12
    P2 -->|Quorum-acknowledged replication| R21
    P2 -->|Quorum-acknowledged replication| R22

    Coordinator -.->|Health checks| P1
    Coordinator -.->|Health checks| R11
    Coordinator -.->|Health checks| R12
    Coordinator -.->|Health checks| P2
    Coordinator -.->|Health checks| R21
    Coordinator -.->|Health checks| R22

🔄 Request Workflow

Write Path

A client sends a SET request to the coordinator.

The coordinator hashes the key.

Binary search identifies the responsible shard.

The request is forwarded to the shard primary.

The primary updates its local cache.

The primary forwards the write to active replicas.

The operation succeeds after the required quorum acknowledges the write.

The coordinator records the operation and returns the response.

Read Path

A client sends a GET request to the coordinator.

The coordinator identifies the responsible shard.

A node is selected in O(1) from the shard's prebuilt eligible read pool.

The selected node returns the value or a cache miss.

During migration, the coordinator can fall back to the previous topology and lazily move the key to its new destination.

The remaining TTL is preserved during the move.

Delete Path

The coordinator routes the delete request using the current topology.

During migration, deletion is applied to both relevant old and new destinations.

This prevents stale copies from surviving a topology change.

🔁 Online Shard Expansion

The coordinator supports shard expansion without immediately blocking all client traffic.

sequenceDiagram
    participant Admin
    participant Coordinator
    participant OldRing as Previous Ring
    participant NewRing as Updated Ring
    participant OldPrimary
    participant NewPrimary

    Admin->>Coordinator: Register new shard
    Coordinator->>Coordinator: Snapshot old ring and topology
    Coordinator->>NewRing: Rebuild sorted shard positions
    Coordinator->>OldPrimary: Enumerate existing keys

    loop For each key whose shard changes
        Coordinator->>OldPrimary: GET value and remaining TTL
        OldPrimary-->>Coordinator: Value + TTL
        Coordinator->>NewPrimary: SET value with remaining TTL
        NewPrimary-->>Coordinator: Write result
        Coordinator->>OldPrimary: DELETE old copy
    end

    Coordinator->>Coordinator: Complete migration
    Coordinator->>Coordinator: Apply queued topology changes

During migration:

normal requests continue using the current routing state,

the previous topology remains available for fallback,

reads can lazily migrate missing keys,

writes remove stale copies from the previous shard,

deletes target both possible destinations,

and additional topology changes are queued until the active migration completes.

❤️ Health Monitoring and Failover

sequenceDiagram
    participant Monitor as Health Monitor
    participant Primary
    participant DB as MongoDB
    participant Failover
    participant Replica
    participant Dashboard

    loop Every health-check interval
        Monitor->>Primary: Health request
    end

    Primary--xMonitor: Repeated failures
    Monitor->>DB: Mark node unavailable
    Monitor->>Failover: Trigger shard failover
    Failover->>DB: Query healthy replicas
    Failover->>Failover: Rank by replication offset and uptime
    Failover->>Replica: Promote to primary
    Replica-->>Failover: Promotion result
    Failover->>DB: Update node roles
    Failover->>Failover: Rebuild routing state
    Failover-->>Dashboard: Emit failover event

The current implementation provides automated failure detection and promotion logic, but it does not claim consensus, linearizability, or guaranteed zero-downtime behaviour under every network-partition or concurrent-failure scenario.

🧠 Cache Engine Design

The cache engine combines:

std::unordered_map for average O(1) key indexing,

a doubly linked list for access-order tracking,

access counters for frequency information,

an ordered expiration structure for TTL scheduling,

and mutex protection for concurrent access.

LRFU-Inspired Eviction

When the cache reaches capacity:

the engine examines a bounded set of the oldest entries,

compares their access counts,

and evicts the least frequently used candidate from that old-entry sample.

This is intentionally described as LRFU-inspired because it combines recency and frequency rather than implementing strict LRU or strict LFU.

💻 Tech Stack

Cache Engine

C++20

CMake

STL containers, threads, mutexes, and atomics

cpp-httplib

nlohmann/json

Coordinator Backend

Node.js

Express

MongoDB

Axios

Socket.IO

Frontend

React

Vite

Socket.IO client

CSS

Infrastructure and Quality

Docker

Docker Compose

C++ unit tests

Concurrent throughput benchmark

GitHub Actions workflows

📁 Repository Structure

Distributed-Cache-System/
├── .github/workflows/          # CI workflows
├── benchmarks/                 # Throughput benchmark
├── coordinator-backend/        # Node.js coordinator and cluster services
│   └── server/
│       ├── models/             # MongoDB models
│       ├── routes/             # Cache, auth, and cluster APIs
│       └── services/           # Hash ring, migration, health, and failover
├── coordinator-frontend/       # React monitoring dashboard
├── cpp-cache-engine/           # CMake configuration and engine Dockerfile
├── src/                        # C++ cache-engine implementation
├── tests/                      # Cache-engine unit tests
├── docker-compose.yml          # Multi-service cluster configuration
└── README.md

🚀 Getting Started

Prerequisites

Install:

Docker

Docker Compose

Git

1. Clone the Repository

git clone https://github.com/Rudy-123/Distributed-Cache-System.git
cd Distributed-Cache-System

2. Build and Start the Cluster

docker compose up --build -d

3. Verify Running Services

docker compose ps

4. View Logs

docker compose logs -f

For a specific service:

docker compose logs -f <service-name>

5. Access the Application

Using the current default configuration:

Frontend dashboard: http://localhost:3000

Coordinator API: http://localhost:5000

Primary cache node: http://localhost:5051

Check docker-compose.yml for the complete list of configured node ports and service names.

6. Stop the Cluster

docker compose down

To remove associated volumes as well:

docker compose down -v

🧪 Testing and Benchmarking

Cache-Engine Tests

The test suite covers:

SET, GET, and DELETE

cache hits and misses

capacity-based eviction

TTL expiration

concurrent access

capacity validation under multithreaded operations

Build and run the test target according to the CMake configuration inside cpp-cache-engine/.

Throughput Benchmark

The benchmark supports concurrent SET and GET requests and reports:

successful operations,

failed operations,

elapsed execution time,

and operations per second.

The benchmark is intended for repeatable functional and throughput evaluation. It does not currently claim p50/p95/p99 latency, replication-lag guarantees, or production-scale performance.

🔌 API Behaviour

The coordinator exposes APIs for:

cache SET, GET, and DELETE,

cluster status,

node registration and management,

authentication,

and monitoring data.

The C++ nodes expose HTTP endpoints used internally for:

cache operations,

health checks,

replication,

peer registration,

role promotion,

statistics,

and key enumeration during migration.

Refer to the route and HTTP-server source files for the exact endpoint paths and request schemas.

⚠️ Current Limitations

This project deliberately prioritises implementation depth and distributed-systems learning over production hardening.

Current limitations include:

in-memory and volatile storage,

no durable write-ahead log or snapshot recovery,

a single coordinator process,

no consensus protocol for primary election,

no formal split-brain prevention under network partitions,

no guarantee of linearizable reads,

no guaranteed zero-downtime behaviour,

limited fault-injection and long-duration stress testing,

and no claim of Redis protocol compatibility.

These limitations are documented to keep the project technically honest and to define clear directions for future work.

🛣️ Future Improvements

Durable snapshots or append-only persistence

Idempotency keys and stronger retry semantics

Consensus-backed leader election

Split-brain prevention and fencing tokens

Configurable consistency levels

Replication-offset validation before reads

Graceful migration recovery after coordinator restart

p50, p95, and p99 latency reporting

Network-delay and packet-loss fault injection

Long-running concurrency and memory stress tests

Authentication, authorization, and transport security hardening

Prometheus-compatible metrics and alerting

🤝 Contributing

Contributions are welcome.

Fork the repository.

Create a feature branch:

git checkout -b feature/your-feature

Add or update tests and documentation.

Commit the changes:

git commit -m "Add your feature"

Push the branch and open a pull request.

📄 License

This project is licensed under the MIT License. See the LICENSE file for details.
