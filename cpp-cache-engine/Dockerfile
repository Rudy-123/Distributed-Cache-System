# Build Stage
FROM gcc:13 AS builder
RUN apt-get update && apt-get install -y cmake && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the full project (build context must be the project root)
# Build with: docker build -f cpp-cache-engine/Dockerfile .
COPY src/ src/
COPY tests/ tests/
COPY cpp-cache-engine/CMakeLists.txt cpp-cache-engine/CMakeLists.txt
COPY cpp-cache-engine/include/ cpp-cache-engine/include/

# Source files use #include "../include/httplib.h" relative to src/,
# which resolves to /app/include/. Symlink so this path works.
RUN ln -s /app/cpp-cache-engine/include /app/include

RUN mkdir -p cpp-cache-engine/build && cd cpp-cache-engine/build \
    && cmake -DCMAKE_BUILD_TYPE=Release .. \
    && make -j$(nproc)

# Run Stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Run as non-root user
RUN useradd -r -s /bin/false cacheuser

WORKDIR /app
COPY --from=builder /app/cpp-cache-engine/build/cache_server /usr/local/bin/cache_server

USER cacheuser
EXPOSE 5051
ENTRYPOINT ["cache_server"]