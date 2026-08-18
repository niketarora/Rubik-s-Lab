cmake_minimum_required(VERSION 3.14)
project(rubiks_cube_solver CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Fetch nlohmann/json
include(FetchContent)
FetchContent_Declare(
  json
  URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(json)

# Add Include Directories
include_directories(include)

# Sources list
set(SOLVER_SOURCES
  src/cube/Cube.cpp
  src/algorithms/BFS.cpp
  src/algorithms/DFS.cpp
  src/algorithms/IDDFS.cpp
  src/algorithms/IDAStar.cpp
  src/algorithms/TwoPhase.cpp
  src/heuristics/Heuristics.cpp
)

# CLI / Daemon Executable
add_executable(rubiks_solver src/main.cpp ${SOLVER_SOURCES})
target_link_libraries(rubiks_solver PRIVATE nlohmann_json::nlohmann_json)

# Test Executable
add_executable(rubiks_tests tests/tests.cpp ${SOLVER_SOURCES})
target_link_libraries(rubiks_tests PRIVATE nlohmann_json::nlohmann_json)
