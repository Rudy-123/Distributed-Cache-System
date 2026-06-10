#include "cache_store.h"

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
        lru.remove(it->second);
        CacheEntry entry(val,ttl); //new object cacheentry
        auto new_it=lru.pushFront(key,entry);
        cache_map[key]=new_it; //new iterator
        return nlohmann::json{{"status","updated"}};
    }
    //for the max size then lru eviction and addition of new
    if(cache_map.size()>=max_size){
        std::string evicted_key=lru.removeLast(); //last ele remove
        if(!evicted_key.empty()){
            cache_map.erase(evicted_key);
            stats.recordEviction();
        }
    }
    //new entry
    CacheEntry entry(val,ttl);
    auto new_it=lru.pushFront(key,entry);//add in front 
    cache_map[key]=new_it;
    return nlohmann::json{{"status","created"}};
}

nlohmann::json CacheStore::del(const std::string&key){
    std::lock_guard<std::mutex>local(mtx);
    stats.recordDelete();
    auto it=cache_map.find(key);
    if(it==cache_map.end()){
        return nlohmann::json{{"status","not_found"}};
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

//check the entries and if expired acc to ttl then remove else keep in cache as if exp h then memory occupy krke waste hoga so remove
int CacheStore::cleanupExpired(){
    std::lock_guard<std::mutex>lock(mtx);
    int count=0; //how many expired entries delete hui h 
    auto& lst=lru.getlist(); //returns the actual lru list 
    auto it=lst.begin();
    while(it!=lst.end()){
        auto current=it;
        it++;
        if(current->second.isExpired()){
            cache_map.erase(current->first);
            lru.remove(current);
            count++;
        }
    }return count; //return the no of entries that were removed
}   