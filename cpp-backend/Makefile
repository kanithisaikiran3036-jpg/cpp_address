CXX = g++
CXXFLAGS = -O3 -std=c++17 -Wall -Wextra

ifeq ($(OS),Windows_NT)
    TARGET_EXT = .exe
    LDFLAGS = -lsqlite3
    TARGET_DIR = ..\bin
    TARGET = $(TARGET_DIR)\proton_core_engine$(TARGET_EXT)
    MKDIR = if not exist $(TARGET_DIR) mkdir $(TARGET_DIR)
    RM = del /Q /F
else
    TARGET_EXT =
    CXXFLAGS += -pthread
    LDFLAGS = -lsqlite3 -lpthread
    TARGET_DIR = ../bin
    TARGET = $(TARGET_DIR)/proton_core_engine$(TARGET_EXT)
    MKDIR = mkdir -p $(TARGET_DIR)
    RM = rm -f
endif

all: $(TARGET)

$(TARGET): engine.cpp
	$(MKDIR)
	$(CXX) $(CXXFLAGS) engine.cpp $(LDFLAGS) -o $(TARGET)
ifneq ($(OS),Windows_NT)
	chmod +x $(TARGET)
endif

clean:
	$(RM) $(TARGET)
