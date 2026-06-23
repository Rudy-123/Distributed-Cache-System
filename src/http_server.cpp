#include "../include/httplib.h"
#include "http_server.h"
#include <iostream>
#include <thread>
#include <chrono>

HttpServer::HttpServer(std::shared_ptr<CacheStore> store,   //cache address
                    std::shared_ptr<ReplicationManager> replication, //Replicationmanager address
                    std::shared_ptr<HeartBeat> hb, //heartbeat address
                    int port, //servers port
                    const std::string& role)
        :cache(store),repl_mgr(replication),heartbeat(hb),server_port(port),server_role(role),
        start_time(std::chrono::steady_clock::now()),
        svr(std::make_unique<httplib::Server>()){}

HttpServer::~HttpServer(){
    stop();
}

void HttpServer::setupRoutes(){ //which url,which req and what action
    //svr points to the server object
    //get health
    svr->Get("/health",[this](const httplib::Request&, httplib::Response& res){ //(req,res)
        auto now = std::chrono::steady_clock::now();
        auto uptime_seconds = std::chrono::duration_cast<std::chrono::seconds>(now - start_time).count();
        nlohmann::json health = {
            {"status", "healthy"},
            {"role", server_role},
            {"keys", cache->size()},
            {"uptime", uptime_seconds},
            {"offset", replication_offset.load()}
        };
        res.set_content(health.dump(), "application/json"); //data sent is of json form
    });

    //get stats
    svr->Get("/stats",[this](const httplib::Request&, httplib::Response& res){
        res.set_content(cache->getStats().dump(),"application/json");
    });

    //get the data from cache 
    svr->Get(R"(/cache/([^/]+))",[this](const httplib::Request&req, httplib::Response& res){ //regex for any type of combination
        std::string key=req.matches[1]; //fetch the key
        auto val=cache->get(key);
        if(val["status"]=="hit"){
            res.set_content(val["entry"].dump(),"application/json");
        }else{
            res.status=404;
            res.set_content(val.dump(),"application/json");
        }
    }); 

    //imp route data is stored of the client and if server is master then its replicated into the slaves
    svr->Post("/cache",[this](const httplib::Request &req,httplib::Response& res){
        try{
            auto body=nlohmann::json::parse(req.body);
            std::string key=body.at("key"); //key extract
            std::string value=body.at("value");
            int ttl=body.value("ttl",0);
            auto local_res=cache->set(key,value,ttl); //save the entry in the cache store
            replication_offset++;
            if(server_role=="master"){
                // Launch replication in a background thread asynchronously (Asynchronous Replication)
                std::thread([this, key, value, ttl]() {
                    // 1500ms delay to simulate network latency and let the user see the replication lag
                    std::this_thread::sleep_for(std::chrono::milliseconds(1500));
                    repl_mgr->replicateSet(key, value, ttl);
                }).detach();
            }
            res.set_content(local_res.dump(),"application/json");
        }catch(const std::exception& e){
            res.status=500;
            res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    //delete 
    svr->Delete("/cache/([^/]+)",[this](const httplib::Request& req,httplib::Response& res){
        std::string key=req.matches[1]; //extract the key from url 
        auto local_res=cache->del(key);
        replication_offset++;
        if(server_role=="master"){
            // Launch deletion in a background thread asynchronously (Asynchronous Replication)
            std::thread([this, key]() {
                std::this_thread::sleep_for(std::chrono::milliseconds(1500));
                repl_mgr->replicateDel(key);
            }).detach();
        }
        res.set_content(local_res.dump(),"application/json");
    });

    //this route only for replica to replicate data from the master once it saves it 
    svr->Post("/replicate",[this](const httplib::Request& req,httplib::Response& res){
        if(server_role!="replica"){
            res.status=403;
            res.set_content(R"({"error":"Only replicas accept replication updates"})","application/json");
            return;
        }
        try{
            auto body=nlohmann::json::parse(req.body); //convert req body in json obj
            std::string key=body.at("key");
            std::string value=body.at("value");
            int ttl=body.value("ttl",0);
            auto local_res=cache->set(key,value,ttl); //stroe in replica cache
            replication_offset++;
            res.set_content(local_res.dump(),"application/json");
        }catch(const std::exception &e){   
            res.status=400;
            res.set_content(nlohmann::json{{"error",e.what()}}.dump(),"application/json");
        }
    });

    // Dynamic peer registration endpoint for Master node
    svr->Post("/peers", [this](const httplib::Request& req, httplib::Response& res) {
        if (server_role != "master") {
            res.status = 403;
            res.set_content(R"({"error":"Only master nodes accept new replication peers"})", "application/json");
            return;
        }
        try {
            auto body = nlohmann::json::parse(req.body);
            std::string host = body.at("host");
            int port = body.at("port");
            repl_mgr->addPeer(host, port);
            std::cout << "[DYNAMIC PEER] Registered replica peer: " << host << ":" << port << std::endl;
            res.set_content(R"({"status":"peer_registered"})", "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(nlohmann::json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // Promotion endpoint to turn a replica into master dynamically
    svr->Post("/promote", [this](const httplib::Request&, httplib::Response& res) {
        server_role = "master";
        repl_mgr->clearPeers();
        std::cout << "[PROMOTE] Node on port " << server_port << " promoted to MASTER" << std::endl;
        res.set_content(R"({"status":"promoted","role":"master"})", "application/json");
    });
}

void HttpServer::start(){
    setupRoutes();
    std::cout<<"Http Server starting on 0.0.0.0: "<< server_port << std::endl;
    svr->listen("0.0.0.0",server_port);
} 

void HttpServer::stop(){
    if(svr->is_running()){
        svr->stop();
        std::cout<<"HTTP Server Stopped";
    }
}