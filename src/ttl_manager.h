//remove the expired cache entries 
#pragma once
#include <thread>
#include <atomic>
#include "cache_store.h"

class TTLManager{
    public:
        explicit TTLManager(CacheStore& store);
        ~TTLManager(); //automatically called when object is destroyed
        void start();
        void stop();

    private:
        void cleanupLoop();
        CacheStore& cache;
        std::thread background_thread;
        std::atomic<bool>running{false};
};