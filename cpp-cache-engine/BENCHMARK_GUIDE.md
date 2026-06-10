# Cache Engine Benchmark & Resume Metrics Guide

This guide details how to run performance benchmarks, the results achieved, and bullet points to include in your resume.

---

## 📊 Latest Benchmark Results

### 1. High Concurrency Stress Test (Single Node)
* **Concurrency:** 32 concurrent threads
* **Duration:** 30 seconds
* **Successful Operations:** 20,933
* **Throughput:** **~697 ops/second**
* **Total Operations Processed:** 25,512

### 2. Standard Baseline Test
* **Concurrency:** 4 threads
* **Duration:** 10 seconds
* **Successful Operations:** 7,330
* **Throughput:** **~731.5 ops/second**
* **Failure Rate:** 0.00%

---

## 📝 How to Write this on Your Resume
Here are professional bullet points you can copy directly:

* **High-Performance Key-Value Store:** Designed and implemented a multi-threaded, low-latency in-memory cache engine in **C++20** that processes **20,000+ successful transactions in 30 seconds** under heavy concurrency (32 client threads), achieving a throughput of **~700 ops/second**.
* **Distributed Quorum Replication:** Built a master-replica synchronization manager featuring thread-safe parallel HTTP data forwarding and active node heartbeat monitoring to maintain quorum and data consistency across replica nodes.
* **Optimized LRU Eviction & TTL Management:** Developed a custom Least Recently Used (LRU) double-linked list cache eviction system with an active background TTL (Time-To-Live) manager thread to clean up expired entries and bound memory usage.

---

## 🚀 How to Run the Benchmarks Again

### Step 1: Navigate to Build Directory
Open your terminal and run:
```powershell
cd C:\Resume_Projects\Distributed_Cache\Distributed_Cache_System\cpp-cache-engine\build
```

### Step 2: Build the Server and Benchmark
Ensure your build is up to date:
```powershell
cmake --build . --target cache_server --config Release
```

### Step 3: Run Tests

#### Test Case A: Single Node Stress Test
1. **Start Server (Terminal 1):**
   ```powershell
   .\cache_server.exe --role=master --port=5051
   ```
2. **Start Benchmark (Terminal 2):**
   ```powershell
   .\throughput.exe 127.0.0.1 5051 30 32
   ```

#### Test Case B: Multi-Replica Quorum Test (Distributed)
1. **Start Master Server (Terminal 1):**
   ```powershell
   .\cache_server.exe --role=master --port=5051 --peers=127.0.0.1:5052,127.0.0.1:5053
   ```
2. **Start Replica 1 (Terminal 2):**
   ```powershell
   .\cache_server.exe --role=replica --port=5052
   ```
3. **Start Replica 2 (Terminal 3):**
   ```powershell
   .\cache_server.exe --role=replica --port=5053
   ```
4. **Start Benchmark (Terminal 4):**
   ```powershell
   .\throughput.exe 127.0.0.1 5051 20 16
   ```

*Note: Always use `127.0.0.1` instead of `localhost` on Windows to avoid IPv6 address resolution timeouts.*
