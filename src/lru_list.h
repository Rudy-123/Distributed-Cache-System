//management of which cache item was sued recently and which was the least recently used
#pragma once
#include <string>
#include <list>//because insertion,deletion and move node in O(1) 
//in C++ stl use std::list for the implementation of DLL
#include<utility> //for std::pair
#include "cache_entry.h"  //cache item structure

class LRUList{
    public:
        using ListType=std::list<std::pair<std::string,CacheEntry>>; //create a DLL which stores key,CacheEntry::
        using Iterator=ListType::iterator; //pointer like object
        LRUList() {}
        Iterator pushFront(const std::string&key, const CacheEntry&entry);//new item at front
        void movetoFront(Iterator it); //take the node and move it to the front
        std::string removeLast(); //remove the LRU item if cache size full and push opeartion occurs in the cache 
        void remove(Iterator it); 
        bool empty () const;
        size_t size() const;
        void clear();
        const ListType& getlist() const {return lst;}
    
    private:
        ListType lst; //this is the actual list 
};  