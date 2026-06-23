#include "httplib.h"
#include "heartbeat.h"
#include <chrono>
#include <iostream>

HeartBeat::HeartBeat(const std::vector<std::pair<std::string,int>>&peers, std::shared_ptr<ReplicationManager> repl_mgr)
        :peer_addresses(peers),peer_states(peers.size(),true),repl_mgr(repl_mgr){}

HeartBeat:: ~HeartBeat(){
    stop();
}

void HeartBeat::start(){
    running.store(true);
    hb_thread=std::thread(&HeartBeat::run,this); //create a new thread and this starts executing run so main thread+heartbeat thread
}

void HeartBeat::stop(){
    if(running.load()){
        running.store(false);
        if(hb_thread.joinable()){
            hb_thread.join(); //wait until heartbeat thread completely finishes
        }
    }
}

bool HeartBeat::isPeerAlive(const std::string& host,int port){
    std::lock_guard<std::mutex>lock(mtx);
    for(size_t i=0;i<peer_addresses.size();i++){
        if(peer_addresses[i].first==host&&peer_addresses[i].second==port){
            return peer_states[i];//return true/false as int he peer_states the state of ith peer is present either true or false
        }
    }return false;
}

void HeartBeat::run(){
    while(running.load()){ 
        std::this_thread::sleep_for(std::chrono::seconds(5)); //wait for 5 seconds then so after every 5 seconds
        if(!running.load()){break;}
        for(size_t i=0;i<peer_addresses.size();i++){
            const auto& addr=peer_addresses[i];
            httplib::Client cli(addr.first,addr.second);//.first is the localhost and .second is the port number so create http client for checking the health
            cli.set_connection_timeout(1,0);
            auto res=cli.Get("/health"); //if peer returns 200 status code 
            bool is_healthy=(res&&res->status==200); //if both true then is_health is true else false
            {
                std::lock_guard<std::mutex>lock(mtx); //update the state 
                if(peer_states[i]!=is_healthy){  
                    peer_states[i]=is_healthy; 
                    if(repl_mgr) {
                        repl_mgr->UpdatePeerStatus(addr.first, addr.second, is_healthy);
                    }
                    std::cout << "[Heartbeat] Peer " << addr.first << ":" << addr.second 
                              << " changed status to: " << (is_healthy ? "ALIVE" : "DEAD") << std::endl;
                }
            }
        }
    }
}