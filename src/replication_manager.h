//manage all the replica nodes and then process the cache updates from the master node
#pragma once
#include <string>
#include <vector>
#include <mutex>
#include <nlohmann/json.hpp>

struct Peer{ //represents 1 replica server
    std::string host;
    int port;
    bool is_alive=true;
};

class ReplicationManager{
    public:
        ReplicationManager()=default;
        void addPeer(const std::string& host,int port);
        void removePeer(const std::string& host,int port);
        void UpdatePeerStatus(const std::string& host,int port,bool is_alive);

        bool replicateSet(const std::string& key,const std::string& value,int ttl); //replication from the master to slaves
        bool replicateDel(const std::string& key); //master deleted and sends the req to do same to the slaves

        void clearPeers();
        nlohmann::json getPeers() const; //return all replicas

    private:
        std::vector<Peer> peers;
        mutable std::mutex mtx; //only 1 thread modifies peers at a time    
};  