#build instruction file for C++ it generates files for VS 
cmake_minimum_required(VERSION 3.20)
project(distributed_cache VERSION 1.0.0 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
find_package(Threads REQUIRED) #for the multithreading support
include_directories(include)

#all these set of cpp files mentioned in the SOURCES will be compiled
set(SOURCES
    ../src/main.cpp
    ../src/lru_list.cpp
    ../src/cache_store.cpp
    ../src/ttl_manager.cpp
    ../src/http_server.cpp
    ../src/replication_manager.cpp
    ../src/heartbeat.cpp
)

include(FetchContent) #enable the downloading from the external libs github or other sources

FetchContent_Declare( 
    json
    GIT_REPOSITORY https://github.com/nlohmann/json.git #download from this github repo 
    GIT_TAG v3.11.3
)
FetchContent_MakeAvailable(json) #download the lib and adds it in the build 

FetchContent_Declare(
    httplib
    GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
    GIT_TAG v0.14.0 
)
FetchContent_MakeAvailable(httplib)

add_executable(cache_server ${SOURCES}) #create the final executable server and the files in the SOURCES would be compiled after build cache_server runs
target_include_directories(cache_server PRIVATE ${httplib_SOURCE_DIR})
target_link_libraries(cache_server PRIVATE Threads::Threads nlohmann_json::nlohmann_json) #link the libraries Threads,json,http

add_executable(cache_tests ../tests/test_cache.cpp ../src/lru_list.cpp ../src/cache_store.cpp) #for the testing purpose build executables
target_link_libraries(cache_tests PRIVATE Threads::Threads nlohmann_json::nlohmann_json) 