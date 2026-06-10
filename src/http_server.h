#pragma once
#include <memory>
#include <string>
#include <nlohmann/json.hpp>
#include "cache_store.h"
#include "replication_manager.h"
#include "heartbeat.h"

namespace httplib {
    class Server;
}

#include <chrono>

class HttpServer{
    public:
        HttpServer(std::shared_ptr<CacheStore> store,   //cache address
                   std::shared_ptr<ReplicationManager> replication, //Replicationmanager address
                   std::shared_ptr<HeartBeat> hb, //heartbeat address
                   int port, //servers port
                   const std::string& role); //role of the node master or replica
        ~HttpServer();
        void start();
        void stop();

    private:
        void setupRoutes(); //register all the api routes
        std::shared_ptr<CacheStore> cache;
        std::shared_ptr<ReplicationManager> repl_mgr;
        std::shared_ptr<HeartBeat> heartbeat;
        int server_port;
        std::string server_role;
        std::chrono::steady_clock::time_point start_time;
        std::unique_ptr<httplib::Server> svr;
};