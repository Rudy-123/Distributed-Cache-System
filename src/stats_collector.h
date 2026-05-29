//tracks cache hit, miss, eviction, and request statistics
#pragma once
#include <cstdint>
#include <nlohmann/json.hpp>

class StatsCollector {
public:
    StatsCollector() = default;

    void recordHit() { hits++; requests++; }
    void recordMiss() { misses++; requests++; }
    void recordEviction() { evictions++; }
    void recordRequest() { requests++; }

    uint64_t getHits() const { return hits; }
    uint64_t getMisses() const { return misses; }
    uint64_t getEvictions() const { return evictions; }
    uint64_t getRequests() const { return requests; }

    double hitRate() const {
        if (requests == 0) return 0.0;
        return static_cast<double>(hits) / requests;
    }

    nlohmann::json toJson() const {
        return nlohmann::json{
            {"hits", hits},
            {"misses", misses},
            {"evictions", evictions},
            {"requests", requests},
            {"hit_rate", hitRate()}
        };
    }

private:
    uint64_t hits = 0;
    uint64_t misses = 0;
    uint64_t evictions = 0;
    uint64_t requests = 0;
};
