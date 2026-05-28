//structure for storing a single cache item 
#pragma once
#include<string>
#include <cstdint>
#include<chrono>//for time related 
#include <nlohmann/json.hpp>

struct CacheEntry{
    std::string value; //actual stored data
    std::chrono::steady_clock::time_point created_at;
    std::chrono::steady_clock::time_point last_accessed;
    int ttl_seconds;
    uint64_t access_count = 0;

    CacheEntry()=default;
    CacheEntry(const std::string &val, int ttl)
        :value(val),
        created_at(std::chrono::steady_clock::now()),
        last_accessed(created_at),
        ttl_seconds(ttl),
        access_count(1){}
    
    bool isExpired() const{
        if(ttl_seconds<=0){
            return false;
        }
        auto now=std::chrono::steady_clock::now(); //take the current time
        auto elapsed=std::chrono::duration_cast<std::chrono::seconds>( //how many seconds gone after creation 
            now-created_at
        ).count();
        if(elapsed>=ttl_seconds){
            return true;
        }return false;
    }

    int remainingTTL() const{ //time left
        if(ttl_seconds<=0){return -1;}
        auto now=std::chrono::steady_clock::now();
        auto elapsed=std::chrono::duration_cast<std::chrono::seconds>(now - created_at).count();//duration cast means the conversion of 1 time duration into another here in seconds it's done
        auto remaining=ttl_seconds-static_cast<int>(elapsed);
        if(remaining>0){return remaining;}
        return 0;
    }

    nlohmann::json toJson()const {
        return nlohmann::json{
            {"value", value},
            {"ttl_remaining",remainingTTL()},
            {"access_count",access_count}
        };
    }
};
