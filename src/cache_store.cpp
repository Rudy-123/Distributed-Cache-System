#include "cache_store.h"
#include <limits>
#include <cstdlib>

CacheStore::CacheStore(size_t capacity):max_size(capacity) {} //when cachestore is created 
nlohmann::json CacheStore::get(const std::string &key){
    std::lock_guard<std::mutex>lock(mtx); //lock mutex so lock cache fromt he other threads trying to access it parallely 
    auto it=cache_map.find(key);
    if(it==cache_map.end()){
        //not found the value to the corresponding key i.e key not there
        stats.recordGet(false);
        return nlohmann::json{{"status","miss"}};//cache miss
    }   
    if(it->second->second.isExpired()){
        if(it->second->second.ttl_seconds > 0){
            auto expires_at = it->second->second.created_at + std::chrono::seconds(it->second->second.ttl_seconds);
            ttl_queue.erase({expires_at, key});
        }
        lru.remove(it->second);//remove from the LRU list
        cache_map.erase(it);
        stats.recordGet(false);
        return nlohmann::json{{"status","miss"}};
    }
    it->second->second.access_count++;
    it->second->second.last_accessed=std::chrono::steady_clock::now();
    lru.movetoFront(it->second);

    stats.recordGet(true);
    return nlohmann::json{
        {"status","hit"}, //status hit and the entry is returned
        {"entry",it->second->second.toJson()}
    };
}

nlohmann::json CacheStore::set(const std::string& key, const std::string& val, int ttl) {
    std::lock_guard<std::mutex>locak(mtx); //only a single thread
    stats.recordSet();//set operation count inc
    //for the updation of value for a specific key 
    auto it=cache_map.find(key);
    if(it!=cache_map.end()){
        if(it->second->second.ttl_seconds > 0){
            auto expires_at = it->second->second.created_at + std::chrono::seconds(it->second->second.ttl_seconds);
            ttl_queue.erase({expires_at, key});
        }
        lru.remove(it->second);
        CacheEntry entry(val,ttl); //new object cacheentry
        auto new_it=lru.pushFront(key,entry);
        cache_map[key]=new_it; //new iterator
        
        if (ttl > 0) {
            auto new_exp = entry.created_at + std::chrono::seconds(ttl);
            ttl_queue.insert({new_exp, key});
        }
        return nlohmann::json{{"status","updated"}};
    }
    // LRFU (Least Recently/Frequently Used) Eviction
    if(cache_map.size()>=max_size){
        std::string evicted_key;
        uint64_t min_freq = std::numeric_limits<uint64_t>::max();
        
        // Sample the 5 oldest items in the LRU to find the LFU item
        auto rit = lru.getlist().rbegin();
        for (int i=0; i<5 && rit != lru.getlist().rend(); i++, ++rit) {
            if (rit->second.access_count <= min_freq) {
                min_freq = rit->second.access_count;
                evicted_key = rit->first;
            }
        }
        
        if(!evicted_key.empty()){
            auto ev_it = cache_map.find(evicted_key);
            if(ev_it != cache_map.end()){
                if(ev_it->second->second.ttl_seconds > 0){
                    auto exp = ev_it->second->second.created_at + std::chrono::seconds(ev_it->second->second.ttl_seconds);
                    ttl_queue.erase({exp, evicted_key});
                }
                lru.remove(ev_it->second);
                cache_map.erase(ev_it);
                stats.recordEviction();
            }
        }
    }
    //new entry
    CacheEntry entry(val,ttl);
    auto new_it=lru.pushFront(key,entry);//add in front 
    cache_map[key]=new_it;
    
    if (ttl > 0) {
        auto new_exp = entry.created_at + std::chrono::seconds(ttl);
        ttl_queue.insert({new_exp, key});
    }
    return nlohmann::json{{"status","created"}};
}

nlohmann::json CacheStore::del(const std::string&key){
    std::lock_guard<std::mutex>local(mtx);
    stats.recordDelete();
    auto it=cache_map.find(key);
    if(it==cache_map.end()){
        return nlohmann::json{{"status","not_found"}};
    }
    if(it->second->second.ttl_seconds > 0){
        auto exp = it->second->second.created_at + std::chrono::seconds(it->second->second.ttl_seconds);
        ttl_queue.erase({exp, key});
    }
    lru.remove(it->second);
    cache_map.erase(it);
    return nlohmann::json{{"status","deleted"}};
}

nlohmann::json CacheStore::getKeys() const{
    std::lock_guard<std::mutex>lock(mtx);
    std::vector<std::string> keys_list; //empty vector
    for(const auto&pair:cache_map){
        if(!pair.second->second.isExpired()){
            keys_list.push_back(pair.first);
        }
    }
    return nlohmann::json{{"status",keys_list}}; //gives the list of keys that are stored in the cache 
}

nlohmann::json CacheStore::getStats() const{
    std::lock_guard<std::mutex>lock(mtx);
    auto s=stats.getStatsJson();//take the stats
    s["keys_count"]=cache_map.size(); //current key count add
    s["max_capacity"]=cache_map.size(); //capacity add
    return s;
}

size_t CacheStore::size() const{
    std::lock_guard<std::mutex>lock(mtx);
    return cache_map.size();
}

// O(log N) Min-Heap TTL Sweep
int CacheStore::cleanupExpired(){
    std::lock_guard<std::mutex>lock(mtx);
    int count=0;
    auto now = std::chrono::steady_clock::now();
    
    while(!ttl_queue.empty()){
        auto top = ttl_queue.begin();
        if (top->first > now) {
            // The very earliest expiring key hasn't expired yet!
            // We can safely instantly stop checking. O(1) stop.
            break;
        }
        
        std::string expired_key = top->second;
        ttl_queue.erase(top);
        
        auto it = cache_map.find(expired_key);
        if (it != cache_map.end()) {
            lru.remove(it->second);
            cache_map.erase(it);
            count++;
        }
    }
    return count; 
}   