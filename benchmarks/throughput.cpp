// Performance benchmark client script
// Fires continuous concurrent SET/GET requests against the cache server
// Usage: ./throughput <host> <port> <duration_seconds> <concurrency>

#include <iostream>
#include <chrono>
#include <thread>
#include <vector>
#include <atomic>
#include <functional>
#include "httplib.h"

std::atomic<uint64_t> total_ops{0};
std::atomic<uint64_t> failed_ops{0};

void runWorker(const std::string& host, int port, int duration_seconds) {
    httplib::Client cli(host, port);
    cli.set_connection_timeout(1, 0);
    cli.set_keep_alive(true); // REQUIRED FOR MASSIVE THROUGHPUT ON WINDOWS

    auto end_time = std::chrono::steady_clock::now() + std::chrono::seconds(duration_seconds);
    int local_counter = 0;
    size_t thread_id = std::hash<std::thread::id>{}(std::this_thread::get_id());

    while (std::chrono::steady_clock::now() < end_time) {
        std::string key = "bench_key_" + std::to_string(thread_id) + "_" + std::to_string(local_counter++);

        // 1. SET
        std::string payload = R"({"key":")" + key + R"(","value":"bench_val_data_payload_string_val"})";
        auto res = cli.Post("/api/cache", payload, "application/json");
        if (res && res->status == 200) {
            total_ops.fetch_add(1);
        } else {
            failed_ops.fetch_add(1);
        }

        // 2. GET
        auto g_res = cli.Get(("/api/cache/" + key).c_str());
        if (g_res && g_res->status == 200) {
            total_ops.fetch_add(1);
        } else {
            failed_ops.fetch_add(1);
        }

        // Throttle removed for raw standalone benchmarking
    }
}

int main(int argc, char* argv[]) {
    std::string host = "localhost";
    int port = 5051;
    int duration = 10;
    int concurrency = 4;

    if (argc > 1) host = argv[1];
    if (argc > 2) port = std::stoi(argv[2]);
    if (argc > 3) duration = std::stoi(argv[3]);
    if (argc > 4) concurrency = std::stoi(argv[4]);

    std::cout << "Starting benchmark against " << host << ":" << port
              << " for " << duration << "s using " << concurrency << " threads...\n";

    auto start_time = std::chrono::steady_clock::now();

    std::vector<std::thread> threads;
    for (int i = 0; i < concurrency; ++i) {
        threads.emplace_back(runWorker, host, port, duration);
    }

    for (auto& t : threads) t.join();

    auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now() - start_time
    ).count();

    double sec = elapsed / 1000.0;
    uint64_t ops = total_ops.load();
    uint64_t fails = failed_ops.load();

    std::cout << "\n--- Benchmark Results ---\n";
    std::cout << "Elapsed Time: " << sec << " seconds\n";
    std::cout << "Successful Ops: " << ops << "\n";
    std::cout << "Failed Ops: " << fails << "\n";
    std::cout << "Throughput: " << (ops / sec) << " ops/second\n";

    return 0;
}
