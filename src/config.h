#pragma once
#include <string>
#include <vector>
#include <sstream>

struct Config{
    int port=5051;
    std::string role="master"; // master or replica
    std::string shardId="shard-1";
    size_t capacity=10000;
    std::vector<std::pair<std::string, int>> peers;
};

inline Config parseArgs(int argc, char* argv[]){ //function reads all the inline arguments and created the config
    Config config;
    for(int i=1;i<argc;i++){ //loop throught the arguments
        std::string arg = argv[i];
        if(arg.rfind("--port",0)==0){
            config.port=std::stoi(arg.substr(7)); //checks whether the string starts with the --port or not
        }
        else if(arg.rfind("--role",0)==0){
            config.role=arg.substr(7);
        }
        else if(arg.rfind("--shardId",0)==0){
            config.shardId=arg.substr(10);
        }
        else if(arg.rfind("--capacity",0)==0){
            config.capacity=std::stoull(arg.substr(11));
        }
        //./cache_server --role=master --port=5051 --peers=localhost:5052,localhost:5053 for reading this kind of peer 
        else if(arg.rfind("--peer",0)==0){
            std::string peers_str = arg.substr(8);
            std::stringstream ss(peers_str);
            std::string peer;
            while (std::getline(ss, peer, ',')) {
                size_t colon = peer.find(':');
                if (colon != std::string::npos) {
                    std::string host = peer.substr(0, colon);
                    int port = std::stoi(peer.substr(colon + 1));
                    config.peers.push_back({host, port});
                }
            }
        }
    }return config;
}