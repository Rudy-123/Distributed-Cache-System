#include "../include/httplib.h"
#include "http_server.h"
#include <iostream>

HttpServer::HttpServer(std::shared_ptr<CacheStore> store,   //cache address
                    std::shared_ptr<ReplicationManager> replication, //Replicationmanager address
                    std::shared_ptr<Heartbeat> hb, //heartbeat address
                    int port, //servers port
                    const std::string& role)
        :cache(store),repl_mgr(replication),heartbeat(hb),server_port(port),server_role(role),
        svr(std::make_unique<httplib::Server>()){}

HttpServer::~HttpServer(){
    stop();
}

void HttpServer::setupRoutes(){ //which url,which req and what action
    //svr points to the server object
    //get health
    svr->Get("/health",[this](const httplib::Request&, httplib::Response& res){ //(req,res)
        nlohmann::json health = {
            {"status", "healthy"},
            {"role", server_role},
            {"keys", cache->size()}
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
            if(server_role=="master"){
                //sends the http req to the slaves 
                bool quorum_ok=repl_mgr->replicateSet(key,value,ttl); //only the master accepts the writes so replicate the data got
                if(!quorum_ok){
                    res.status=500;
                    res.set_content(R"({"status":"replication_failure"})","application/json");
                    return ;
                }
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
        if(server_role=="master"){
            repl_mgr=replicateDel(key); //sends req to delete the value present at this key to the slaves
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
            res.set_content(local_res.dump(),"application/json");
        }catch(const std::exception &e){   
            res.status=400;
            res.set_content(nlohmann::json{{"error",e.what()}}.dump(),"application/json");
        }
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