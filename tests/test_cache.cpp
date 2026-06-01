//unit testing file 
#include<cassert> //assert(condition) if condition is true then continue else it stops the execution of the program
#include<iostream>
#include<thread>
#include<vector>
#include "cache_store.h"

void testBasicOperations(){
    CacheStore cache(10);
    cache.set("key1","value1",0);
    auto res=cache.get("key1");   
    assert(res["status"]=="hit"); //check if the key was found or not
    assert(res["entry"]["value"]=="value1"); //check if stores value is correct 
    cache.del("key1");
    res=cache.get("key1");
    assert(res["status"]=="miss");
    std::cout<<"TestBasicOperations Passed !";
}

void testLRUEviction(){
    CacheStore cache(3);
    cache.set("k1","v1");
    cache.set("k2","v2");
    cache.set("k3","v3");
    //k1 is LRU
    cache.get("k1");//now k2 would be LRU so k1 would now be MRU
    cache.set("K4","v4");//remove k2 and insert k4 
    assert(cache.get("k2")["status"]=="miss");
    assert(cache.get("k1")["status"]=="hit");
    std::cout<<"TestLRUEviction Passed !";
}

void testTTLExpiry(){
    CacheStore cache(5);
    cache.set("k1","v1",1);//1 sec TTL
    assert(cache.get("k1")["status"]=="hit");
    std::this_thread::sleep_for(std::chrono::milliseconds(1100));//sleep for more than 1 sec so k1 ttl hit so it should be removed
    assert(cache.get("k1")["status"]=="miss");
    std::cout<<"testTTLExpiry Passed !";
}

void testConcurrency(){ //check the thread safety
    CacheStore cache(1000);
    std::vector<std::thread>threads; //store all the thread objects
    for(int i=0;i<8;i++){ //create 8 threads
        threads.emplace_back([&cache,i]{ //creates a new thread and pushes it into the vector 
            for(int j=0;j<500;j++){ //each thread performs 500 operations
                std::string key="th_" + std::to_string(i)+"_" + std::to_string(j); //unique key creation
                cache.set(key, "data", 0); //store key
                cache.get(key); //get key
            } 
        });
    }
    //total ops=8(threads)*500(ops)=4000 inserts
    for(auto &t:threads){
        t.join(); //waiting for all threads to perform their operation
    }
    assert(cache.size()<=1000);
    std::cout<<"testConcurrency Passed !";
}

int main(){
    testBasicOperations();
    testLRUEviction();
    testTTLExpiry();
    testConcurrency();
    std::cout<<"ALL The tests are passed !!";
    return 0;
}