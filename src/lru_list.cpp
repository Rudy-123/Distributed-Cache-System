//implements the functions of the LRU list clas
#include "lru_list.h"

LRUList::Iterator LRUList::pushFront(const std::string&key, const CacheEntry& entry){
    lst.push_front({key,entry}); //add key,pair at beginning of list in DLL normal implementation head,tail nodes and then the entry node is used
    return lst.begin();//points to the 1st ele
}

void LRUList::movetoFront(Iterator it){
    lst.splice(lst.begin(),lst,it); //moves it to beginning splice doesnot copy data it just changes internal links O(1) 
    //in normal implementation for this prev,next pointers are used and they are connected and hence node is removed and added as head->next
}

std::string LRUList::removeLast(){
    if(lst.empty()){
        return "";
    }else{
        std::string key=lst.back().first;
        lst.pop_back();
        return key;
    }
}    

void LRUList::remove(Iterator it){
    lst.erase(it);
}

size_t LRUList::size() const{
    return lst.size();
}

bool LRUList::empty() const{
    return lst.empty();
}

void LRUList::clear(){
    return lst.clear();
}