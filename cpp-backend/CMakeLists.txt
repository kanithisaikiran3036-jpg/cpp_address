cmake_minimum_required(VERSION 3.15)
project(ProtonCoreEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Binary output destination
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/../bin)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_CURRENT_SOURCE_DIR}/../bin)

# Windows specific configurations
if (WIN32)
    add_definitions(-DWIN32 -D_WINDOWS -D_CRT_SECURE_NO_WARNINGS)
    if (MSVC)
        add_compile_options(/W3 /EHsc /O2 /permissive-)
    else()
        add_compile_options(-O3 -Wall -Wextra)
    endif()
else()
    add_compile_options(-O3 -Wall -Wextra -pthread)
endif()

# Source file selection
if (WIN32)
    set(ENGINE_SOURCES engine_windows.cpp)
else()
    set(ENGINE_SOURCES engine.cpp)
endif()

add_executable(proton_core_engine ${ENGINE_SOURCES})

# SQLite3 linking
find_package(SQLite3 QUIET)
if (SQLite3_FOUND)
    target_link_libraries(proton_core_engine PRIVATE SQLite::SQLite3)
else()
    # Fallback to direct library link
    if (WIN32)
        target_link_libraries(proton_core_engine PRIVATE sqlite3)
    else()
        target_link_libraries(proton_core_engine PRIVATE sqlite3 pthread)
    endif()
endif()

if (WIN32)
    set_target_properties(proton_core_engine PROPERTIES OUTPUT_NAME "proton_core_engine")
endif()
