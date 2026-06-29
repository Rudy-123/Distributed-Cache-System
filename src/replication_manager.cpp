#include "httplib.h"
#include "replication_manager.h"
#include <thread>
#include <atomic>
#include <iostream>

void ReplicationManager::addPeer(const std::string& host,int port){
    std::lock_guard<std::mutex>lock(mtx);
    peers.push_back({host,port,true});
}

void ReplicationManager::removePeer(const std::string& host,int port){
    std::lock_guard<std::mutex>lock(mtx);
    auto it=std::remove_if(peers.begin(),peers.end(),[&](const Peer& p){
        return p.host==host && p.port==port;
    });
    peers.erase(it,peers.end());
}

void ReplicationManager::UpdatePeerStatus(const std::string& host,int port,bool alive){
    std::lock_guard<std::mutex>lock(mtx);
    for(auto &p:peers){
        if(p.host==host&&p.port==port){
            p.is_alive=alive;
            break;
        }
    }
}

bool ReplicationManager::replicateSet(const std::string &key,const std::string& value,int ttl){
    //replicating the data to all the slave nodes
    //if the quorum is acheieved it returns true and else it returns false
    std::vector<Peer>target_peers;
    {
        std::lock_guard<std::mutex>lock(mtx); //copy carefully as this time also many threads can access the peers vector for addd,remove,update etc etc so copy safely without any errors
        target_peers=peers;
    }
    if(target_peers.empty()){return true;} //only master exists no slaves
    int successfull_acks = 1;
    int total_nodes = target_peers.size() + 1; // self + others
    int quorum_required = (total_nodes / 2) + 1; // quorum is > 50%
    for(const auto& peer : target_peers){
        if(!peer.is_alive){continue;}
        httplib::Client cli(peer.host,peer.port);
        cli.set_connection_timeout(1,0);

        nlohmann::json payload={
            {"key", key},
            {"value", value},
            {"ttl", ttl}
        };
        auto res=cli.Post("/replicate",payload.dump(),"application/json"); 
        if(res&&res->status==200){  //if 200 status code received then add the acks that data is shared to replica
            successfull_acks++;
        }
    }
    return successfull_acks >= quorum_required;
}

bool ReplicationManager::replicateDel(const std::string &key){
    std::vector<Peer>target_peers;
    {
        std::lock_guard<std::mutex>lock(mtx);
        target_peers=peers; //list of replica servers
    }
    if(target_peers.empty()){return true;} //no replica server no deletion 
    for(const auto& peer:target_peers){
        if(!peer.is_alive){continue;}
        httplib::Client cli(peer.host,peer.port);
        cli.set_connection_timeout(1,0);
        cli.Delete(("/replicate/" + key).c_str());
    }
    return true;
}

void ReplicationManager::clearPeers() {
    std::lock_guard<std::mutex> lock(mtx);
    peers.clear();
}

nlohmann::json ReplicationManager::getPeers() const {
    std::lock_guard<std::mutex> lock(mtx);
    nlohmann::json list = nlohmann::json::array();
    for (const auto& p : peers) {
        list.push_back({
            {"host", p.host},
            {"port", p.port},
            {"alive", p.is_alive}
        });
    }
    return list;
}