#include<iostream>
#include<string>
#include<memory>
#include<vector>
#include<sstream> //string parsing 
#include<csignal> //signal handling
#include "config.h"
#include "cache_store.h" //main cache system
#include "ttl_manager.h" //manager to remove expired keys
#include "replication_manager.h" //data replication btwn nodes
#include "heartbeat.h" //checking for server failure
#include "http_server.h" //http api server get,put,pose,delete

std::unique_ptr<HttpServer> server_ptr=nullptr; //unique_ptr automatic memory management and for Httpserver
std::unique_ptr<TTLManager> ttl_ptr=nullptr;
std::unique_ptr<Heartbeat> hb_ptr=nullptr;

void handlesignal(int signal){ //if ctrl c pressed then this would run 
    std::cout<< " Signal " << signal << " received. Initialising graceful shutdown... ";
    //if anything is running stop it safely
    if(server_ptr){server_ptr->stop();} 
    if(ttl_ptr){ttl_ptr->stop();}
    if(hb_ptr){hb_ptr->stop();}
    exit(0);
}

int main(int argc,char *argv[]){ //no of args and actual values of args
    std::signal(SIGINT,handlesignal);
    std::signal(SIGTERM,handlesignal); 

    Config config=parseArgs(argc,argv);//parseArgs is the function 
    std::cout << "Starting cache server on port " << config.port << " as role: " << config.role << std::endl;

    auto cache=std::make_shared<CacheStore>(config.capacity);//shared as multiple components would use same cache
    ttl_ptr=std::make_unique<TTLManager>(*cache);
    ttl_ptr->start();

    auto repl_mgr=std::make_shared<ReplicationManager>();
    for(const auto& peer:config.peers){ //peer is the current peer node and config.peers has the list of all the nodes
        repl_mgr->addPeer(peer.host,peer.port);
    }
    if(!config.peers.empty()){
        hb_ptr=std::make_unique<Heartbeat>(config.peers);
        hb_ptr->start; //start the background monitoring
    }
    server_ptr=std::make_unique<HttpServer>(cache,repl_mgr,hb_ptr,config.port,config.role); //create the server with all the components 
    server_ptr->start();

    return 0;
}