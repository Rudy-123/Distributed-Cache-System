//ping every few seconds and check if a particular replica is alive or not by pinging it every few seconds
#pragma once
#include <string>
#include <vector>
#include <thread>
#include <atomic>
#include <mutex>
#include <utility>

#include "replication_manager.h"
#include <memory>

class HeartBeat{
    public: 
        explicit HeartBeat(const std::vector<std::pair<std::string,int>>&peers, std::shared_ptr<ReplicationManager> repl_mgr = nullptr);
        ~HeartBeat();
        void start();
        void stop();
        bool isPeerAlive(const std::string& host,int port);
    
    private:
        void run();
        std::vector<std::pair<std::string,int>>peer_addresses;
        std::vector<bool> peer_states; //stores alive/dead status
        std::thread hb_thread; //this thread will execute run() function
        std::atomic<bool> running{false};
        mutable std::mutex mtx;
        std::shared_ptr<ReplicationManager> repl_mgr;
};  