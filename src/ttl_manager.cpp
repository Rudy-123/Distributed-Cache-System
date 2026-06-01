#include "ttl_manager.h"
#include <chrono>
#include <iostream>

TTLManager::TTLManager(CacheStore& store):cache(store){} //constructor 
TTLManager::~TTLManager(){
    stop(); //ensures that the background thread is stopped when the object is destroyed
}

void TTLManager::start(){
    running.store(true);
    background_thread=std::thread(& TTLManager::cleanupLoop,this);
}

void TTLManager::stop(){
    if(running.load()){ //checks if the thread is still running 
        running.store(false); //signals the bg thread to stop
        if(background_thread.joinable()){
            background_thread.join();  //i would not continue the shutdown until u dont close completely this is what the main thread would do to the TTL thread
        }
        std::cout<<"TTL background thread stopped";
    }
}

void TTLManager::cleanupLoop(){
    while(running.load()){
        std::this_thread::sleep_for(std::chrono::seconds(10));//the thread that would check for the expired ones and creating the thread every 10 seconds to do so 
        if(!running.load()){
            break;
        }
        int evicted=cache.cleanupExpired();
        if(evicted>0){
            std::cout<<"[TTL Manager] Evicted "<< evicted << "expired keys\n";
        }
    }
}