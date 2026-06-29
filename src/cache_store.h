#pragma once
#include <string>
#include <unordered_map>
#include <thread>
#include <mutex>
#include <vector>
#include <set>
#include <nlohmann/json.hpp>
#include <chrono>
#include "lru_list.h"
#include "stats_collector.h" //tracks cache miss,hit,eviction,req's

class CacheStore{
    public:
        explicit CacheStore(size_t capacity=10000);
        nlohmann::json get(const std::string &key);
        nlohmann::json set(const std::string &key,const std::string &val,int ttl=0);//stores data in cache
        nlohmann::json del(const std::string &key);
        nlohmann::json getKeys() const;//returns all the keys stored
        nlohmann::json getStats() const;//returns the cache statistics
        size_t size() const;
        int cleanupExpired(); //removes the expired ttl entries returns the no of expired items
        StatsCollector& getStatsCollector() {return stats;}
        
    private:
        size_t max_size;
        LRUList lru;//list object .front and .back 
        std::unordered_map<std::string,LRUList::Iterator> cache_map;
        std::set<std::pair<std::chrono::steady_clock::time_point, std::string>> ttl_queue;
        mutable std::mutex mtx;
        mutable StatsCollector stats;
};