#pragma once
#include <atomic>
#include <nlohmann/json.hpp>

class StatsCollector{
    public:
        std::atomic<uint64_t>total_gets{0};
        std::atomic<uint64_t>total_sets{0};
        std::atomic<uint64_t>total_deletes{0};
        std::atomic<uint64_t>hits{0};
        std::atomic<uint64_t>misses{0};
        std::atomic<uint64_t>evictions{0}; //removed count from cache

        StatsCollector()=default;

        void recordGet(bool hit){
            total_gets.fetch_add(1);//counter increment
            if(hit){
                hits.fetch_add(1);
            }else{
                misses.fetch_add(1);
            }
        }

        void recordSet(){
            total_sets.fetch_add(1);
        }

        void recordDelete(){
            total_deletes.fetch_add(1);
        }

        void recordEviction(){
            evictions.fetch_add(1);
        }

        double getHitRatio() const{
            uint64_t h=hits.load();
            uint64_t m=misses.load();
            if(h+m==0){return 0.0;}
            return static_cast<double>(h)/(h+m);
        }

        nlohmann::json getStatsJson() const {
                return nlohmann::json{
                {"total_gets",total_gets.load()},
                {"total_sets",total_sets.load()},
                {"total_deletes",total_deletes.load()},
                {"hits",hits.load()},
                {"misses",misses.load()},
                {"evictions",evictions.load()},
                {"hit_ratio",getHitRatio()}
            };
        }

        void reset(){
            total_gets.store(0);
            total_sets.store(0);
            total_deletes.store(0);
            hits.store(0);
            misses.store(0);
            evictions.store(0);
        }
};
