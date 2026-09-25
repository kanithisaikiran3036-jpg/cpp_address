#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#define _CRT_SECURE_NO_WARNINGS

#include <windows.h>
#include <direct.h>   // _mkdir
#include <io.h>
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <chrono>
#include <iomanip>
#include <algorithm>
#include <cstring>
#include <sqlite3.h>

#if defined(_MSC_VER)
    #pragma comment(lib, "sqlite3.lib")
    #define strcasecmp _stricmp
#endif

// ============================================================================
// Nexus Personnel Directory - Native Windows C++ Storage & Query Engine
// Architecture: Native Win32 / Win64, MSVC 2019/2022 & MinGW-w64 Compatible
// Storage: SQLite 3 with Write-Ahead Logging (WAL) Mode
// Security: Role-Based Directory Privileges (Sole Admin vs Staff)
// ============================================================================

namespace ProtonWindowsCore {

// Windows UTF-8 JSON String Escaping
static inline std::string escapeJson(const std::string& s) {
    std::ostringstream o;
    for (auto c = s.cbegin(); c != s.cend(); ++c) {
        if (*c == '"') o << "\\\"";
        else if (*c == '\\') o << "\\\\";
        else if (*c == '\b') o << "\\b";
        else if (*c == '\f') o << "\\f";
        else if (*c == '\n') o << "\\n";
        else if (*c == '\r') o << "\\r";
        else if (*c == '\t') o << "\\t";
        else if ('\x00' <= *c && *c <= '\x1f') {
            o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(*c);
        } else {
            o << *c;
        }
    }
    return o.str();
}

static inline std::string unescapeJson(const std::string& s) {
    std::string res;
    for (size_t i = 0; i < s.length(); ++i) {
        if (s[i] == '\\' && i + 1 < s.length()) {
            char next = s[i+1];
            if (next == '"') { res += '"'; i++; }
            else if (next == '\\') { res += '\\'; i++; }
            else if (next == 'n') { res += '\n'; i++; }
            else if (next == 'r') { res += '\r'; i++; }
            else if (next == 't') { res += '\t'; i++; }
            else { res += next; i++; }
        } else {
            res += s[i];
        }
    }
    return res;
}

static inline std::string extractJsonField(const std::string& json, const std::string& key) {
    std::string pattern = "\"" + key + "\":";
    size_t pos = json.find(pattern);
    if (pos == std::string::npos) {
        pattern = "\"" + key + "\" :";
        pos = json.find(pattern);
        if (pos == std::string::npos) return "";
    }
    pos += pattern.length();
    while (pos < json.length() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    if (pos >= json.length()) return "";

    if (json[pos] == '"') {
        pos++;
        size_t end = pos;
        while (end < json.length()) {
            if (json[end] == '"' && json[end-1] != '\\') break;
            end++;
        }
        return unescapeJson(json.substr(pos, end - pos));
    } else if (json[pos] == '{' || json[pos] == '[') {
        char openChar = json[pos];
        char closeChar = (openChar == '{') ? '}' : ']';
        int depth = 1;
        size_t end = pos + 1;
        while (end < json.length() && depth > 0) {
            if (json[end] == openChar) depth++;
            else if (json[end] == closeChar) depth--;
            end++;
        }
        return json.substr(pos, end - pos);
    } else {
        size_t end = pos;
        while (end < json.length() && json[end] != ',' && json[end] != '}' && json[end] != ']' && json[end] != '\n' && json[end] != '\r') {
            end++;
        }
        std::string val = json.substr(pos, end - pos);
        while (!val.empty() && (val.back() == ' ' || val.back() == '\t')) val.pop_back();
        return val;
    }
}

class Database {
private:
    sqlite3* db = nullptr;
    std::string dbPath;

public:
    Database(const std::string& path) : dbPath(path) {}

    ~Database() {
        if (db) {
            sqlite3_close(db);
        }
    }

    bool open() {
        int rc = sqlite3_open(dbPath.c_str(), &db);
        if (rc != SQLITE_OK) {
            std::cerr << "[Windows C++ Engine] Failed to open SQLite db: " << sqlite3_errmsg(db) << std::endl;
            return false;
        }

        execute("PRAGMA journal_mode = WAL;");
        execute("PRAGMA synchronous = NORMAL;");
        execute("PRAGMA cache_size = -64000;"); // 64MB cache
        execute("PRAGMA temp_store = MEMORY;");
        execute("PRAGMA foreign_keys = ON;");

        initSchema();
        return true;
    }

    bool execute(const std::string& sql) {
        char* err = nullptr;
        int rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &err);
        if (rc != SQLITE_OK) {
            if (err) {
                std::cerr << "[Windows C++ Engine SQL Error]: " << err << " in: " << sql << std::endl;
                sqlite3_free(err);
            }
            return false;
        }
        return true;
    }

    void initSchema() {
        std::string schema = R"(
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                staff_id TEXT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Staff',
                status TEXT NOT NULL DEFAULT 'Active',
                department TEXT DEFAULT 'Operations',
                location TEXT DEFAULT 'Seattle HQ',
                phone TEXT DEFAULT '+1 (555) 019-8273',
                avatar_url TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
            CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);

            CREATE TABLE IF NOT EXISTS activity_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                actor_name TEXT NOT NULL,
                action TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS departments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                code TEXT NOT NULL,
                manager TEXT,
                headcount INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                city TEXT NOT NULL,
                country TEXT NOT NULL,
                address TEXT,
                timezone TEXT
            );

            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                category TEXT DEFAULT 'Client',
                job_title TEXT,
                address TEXT,
                is_key_account INTEGER DEFAULT 0,
                is_archived INTEGER DEFAULT 0,
                avatar_url TEXT,
                tags TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_contacted_at TEXT
            );

            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL,
                content TEXT NOT NULL,
                author TEXT DEFAULT 'System Admin',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS password_resets (
                email TEXT PRIMARY KEY,
                code TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                attempts INTEGER DEFAULT 0
            );
        )";

        execute(schema);
        seedInitialDataIfEmpty();
    }

    void seedInitialDataIfEmpty() {
        sqlite3_stmt* stmt = nullptr;
        int rc = sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users;", -1, &stmt, nullptr);
        if (rc == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                int count = sqlite3_column_int(stmt, 0);
                sqlite3_finalize(stmt);
                if (count > 0) return;
            } else {
                sqlite3_finalize(stmt);
            }
        }

        execute("BEGIN TRANSACTION;");

        // 1. Sole System Administrator
        execute(R"(
            INSERT INTO users (id, staff_id, name, email, password, role, status, department, location, phone, created_at, updated_at)
            VALUES (
                'u_admin_sole',
                '—',
                'System Administrator',
                'kanithisaikiran3036@gmail.com',
                'admin123',
                'Admin',
                'Active',
                'Executive Leadership',
                'Seattle HQ',
                '+1 (555) 019-8273',
                '2026-08-15 09:30:00',
                '2026-09-25 04:30:00'
            );
        )");

        // 2. Initial Staff Members
        execute(R"(
            INSERT INTO users (id, staff_id, name, email, password, role, status, department, location, phone, avatar_url, created_at, updated_at)
            VALUES (
                'u_staff_1002',
                'STF-1002',
                'Alex Rivera',
                'a.rivera@nexus.corp',
                'staff123',
                'Staff',
                'Active',
                'Engineering',
                'San Francisco',
                '+1 (555) 123-4567',
                '',
                '2026-09-14 13:46:48',
                '2026-09-25 04:12:03'
            );

            INSERT INTO users (id, staff_id, name, email, password, role, status, department, location, phone, avatar_url, created_at, updated_at)
            VALUES (
                'u_staff_1001',
                'STF-1001',
                'Sarah Jenkins',
                's.jenkins@nexus.corp',
                'staff123',
                'Staff',
                'Active',
                'Operations',
                'Seattle HQ',
                '+1 (555) 019-8273',
                '',
                '2026-09-09 13:46:48',
                '2026-09-25 04:10:33'
            );
        )");

        // Departments
        execute(R"(
            INSERT INTO departments (id, name, code, manager, headcount) VALUES
            ('dept_1', 'Operations', 'OPS', 'Sarah Jenkins', 12),
            ('dept_2', 'Engineering', 'ENG', 'Alex Rivera', 28),
            ('dept_3', 'Product & Design', 'PRD', 'Elena Rostova', 15),
            ('dept_4', 'Marketing', 'MKT', 'Marcus Vance', 9),
            ('dept_5', 'Human Resources', 'HR', 'Rachel Adams', 6);
        )");

        // Locations
        execute(R"(
            INSERT INTO locations (id, name, city, country, address, timezone) VALUES
            ('loc_1', 'Seattle HQ', 'Seattle', 'United States', '1200 Innovation Drive, Suite 400', 'PST (UTC-8)'),
            ('loc_2', 'San Francisco', 'San Francisco', 'United States', '450 Market Street, Suite 210', 'PST (UTC-8)'),
            ('loc_3', 'New York', 'New York', 'United States', '880 7th Ave, Floor 14', 'EST (UTC-5)'),
            ('loc_4', 'Austin Hub', 'Austin', 'United States', '100 Enterprise Way', 'CST (UTC-6)'),
            ('loc_5', 'London Office', 'London', 'United Kingdom', '25 Finsbury Circus', 'GMT (UTC+0)');
        )");

        // Activity Logs
        execute(R"(
            INSERT INTO activity_logs (id, user_id, actor_name, action, description, created_at) VALUES
            ('act_1', 'u_admin_sole', 'System Administrator', 'Staff Created', 'Created staff member Alex Rivera (STF-1002)', datetime('now', '-10 days')),
            ('act_2', 'u_admin_sole', 'System Administrator', 'Staff Created', 'Created staff member Sarah Jenkins (STF-1001)', datetime('now', '-15 days')),
            ('act_3', 'u_admin_sole', 'System Administrator', 'System Initialized', 'Windows C++ Engine database provisioned', datetime('now', '-30 days'));
        )");

        execute("COMMIT;");
    }

    std::string authenticateUser(const std::string& email, const std::string& password) {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT id, staff_id, name, email, role, status, department, location, phone, avatar_url, created_at FROM users WHERE lower(email) = lower(?) AND password = ?;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Database prepare error\"}";
        }

        sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 2, password.c_str(), -1, SQLITE_STATIC);

        std::ostringstream ss;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            std::string id = (const char*)sqlite3_column_text(stmt, 0);
            std::string staff_id = (const char*)sqlite3_column_text(stmt, 1);
            std::string name = (const char*)sqlite3_column_text(stmt, 2);
            std::string uemail = (const char*)sqlite3_column_text(stmt, 3);
            std::string role = (const char*)sqlite3_column_text(stmt, 4);
            std::string status = (const char*)sqlite3_column_text(stmt, 5);
            std::string dept = (const char*)sqlite3_column_text(stmt, 6);
            std::string loc = (const char*)sqlite3_column_text(stmt, 7);
            const char* phone = (const char*)sqlite3_column_text(stmt, 8);
            const char* avatar = (const char*)sqlite3_column_text(stmt, 9);
            const char* cr = (const char*)sqlite3_column_text(stmt, 10);

            logActivity(id, name, "User Login", name + " (" + role + ") authenticated into directory");

            ss << "{\"success\":true,\"user\":{";
            ss << "\"id\":\"" << escapeJson(id) << "\",";
            ss << "\"staff_id\":\"" << escapeJson(staff_id) << "\",";
            ss << "\"name\":\"" << escapeJson(name) << "\",";
            ss << "\"email\":\"" << escapeJson(uemail) << "\",";
            ss << "\"role\":\"" << escapeJson(role) << "\",";
            ss << "\"status\":\"" << escapeJson(status) << "\",";
            ss << "\"department\":\"" << escapeJson(dept) << "\",";
            ss << "\"location\":\"" << escapeJson(loc) << "\",";
            ss << "\"phone\":\"" << (phone ? escapeJson(phone) : "") << "\",";
            ss << "\"avatar_url\":\"" << (avatar ? escapeJson(avatar) : "") << "\",";
            ss << "\"created_at\":\"" << (cr ? escapeJson(cr) : "") << "\"";
            ss << "}}";
        } else {
            ss << "{\"success\":false,\"error\":\"Invalid email or password\"}";
        }
        sqlite3_finalize(stmt);
        return ss.str();
    }

    std::string listUsers(const std::string& search = "") {
        std::string sql = "SELECT id, staff_id, name, email, role, status, department, location, phone, avatar_url, created_at FROM users ";
        if (!search.empty()) {
            std::string s = escapeJson(search);
            sql += "WHERE name LIKE '%" + s + "%' OR email LIKE '%" + s + "%' OR staff_id LIKE '%" + s + "%' OR department LIKE '%" + s + "%' ";
        }
        sql += "ORDER BY CASE role WHEN 'Staff' THEN 1 ELSE 2 END, staff_id DESC;";

        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"total\":0,\"items\":[]}";
        }

        std::ostringstream ss;
        ss << "{\"items\":[";
        bool first = true;
        int count = 0;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) ss << ",";
            first = false;
            count++;
            ss << "{";
            ss << "\"id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 0)) << "\",";
            ss << "\"staff_id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 1)) << "\",";
            ss << "\"name\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 2)) << "\",";
            ss << "\"email\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 3)) << "\",";
            ss << "\"role\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 4)) << "\",";
            ss << "\"status\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 5)) << "\",";
            ss << "\"department\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 6)) << "\",";
            ss << "\"location\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 7)) << "\",";
            const char* phone = (const char*)sqlite3_column_text(stmt, 8);
            ss << "\"phone\":\"" << (phone ? escapeJson(phone) : "") << "\",";
            const char* avatar = (const char*)sqlite3_column_text(stmt, 9);
            ss << "\"avatar_url\":\"" << (avatar ? escapeJson(avatar) : "") << "\",";
            const char* cr = (const char*)sqlite3_column_text(stmt, 10);
            ss << "\"created_at\":\"" << (cr ? escapeJson(cr) : "") << "\"";
            ss << "}";
        }
        sqlite3_finalize(stmt);
        ss << "],\"total\":" << count << "}";
        return ss.str();
    }

    std::string getUserStatus(const std::string& userId) {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT id, staff_id, name, email, role, status, department, location, phone, avatar_url, created_at, updated_at FROM users WHERE id = ?;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"error\":\"Database error\"}";
        }
        sqlite3_bind_text(stmt, 1, userId.c_str(), -1, SQLITE_STATIC);

        std::ostringstream ss;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            ss << "{";
            ss << "\"id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 0)) << "\",";
            ss << "\"staff_id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 1)) << "\",";
            ss << "\"name\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 2)) << "\",";
            ss << "\"email\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 3)) << "\",";
            ss << "\"role\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 4)) << "\",";
            ss << "\"status\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 5)) << "\",";
            ss << "\"department\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 6)) << "\",";
            ss << "\"location\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 7)) << "\",";
            const char* phone = (const char*)sqlite3_column_text(stmt, 8);
            ss << "\"phone\":\"" << (phone ? escapeJson(phone) : "") << "\",";
            const char* avatar = (const char*)sqlite3_column_text(stmt, 9);
            ss << "\"avatar_url\":\"" << (avatar ? escapeJson(avatar) : "") << "\",";
            const char* cr = (const char*)sqlite3_column_text(stmt, 10);
            ss << "\"created_at\":\"" << (cr ? escapeJson(cr) : "") << "\",";
            const char* up = (const char*)sqlite3_column_text(stmt, 11);
            ss << "\"updated_at\":\"" << (up ? escapeJson(up) : "") << "\"";
            ss << "}";
        } else {
            ss << "{\"error\":\"User not found\"}";
        }
        sqlite3_finalize(stmt);
        return ss.str();
    }

    bool isCallerAdmin(const std::string& callerId) {
        if (callerId.empty()) return false;
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT role FROM users WHERE id = ?;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, callerId.c_str(), -1, SQLITE_STATIC);
        bool isAdmin = false;
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            std::string role = (const char*)sqlite3_column_text(stmt, 0);
            isAdmin = (role == "Admin");
        }
        sqlite3_finalize(stmt);
        return isAdmin;
    }

    std::string generateNextStaffId() {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT staff_id FROM users WHERE staff_id LIKE 'STF-%' ORDER BY staff_id DESC LIMIT 1;";
        int maxNum = 1002;
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                std::string s = (const char*)sqlite3_column_text(stmt, 0);
                if (s.length() > 4) {
                    try {
                        int n = std::stoi(s.substr(4));
                        if (n >= maxNum) maxNum = n + 1;
                    } catch (...) {}
                }
            }
            sqlite3_finalize(stmt);
        }
        return "STF-" + std::to_string(maxNum);
    }

    std::string createStaff(const std::string& callerId, const std::string& jsonInput) {
        if (!isCallerAdmin(callerId)) {
            return "{\"success\":false,\"error\":\"Unauthorized: Only the System Administrator can add staff.\"}";
        }

        std::string name = extractJsonField(jsonInput, "name");
        std::string email = extractJsonField(jsonInput, "email");
        std::string password = extractJsonField(jsonInput, "password");
        if (password.empty()) password = "password123";
        std::string department = extractJsonField(jsonInput, "department");
        if (department.empty()) department = "Operations";
        std::string location = extractJsonField(jsonInput, "location");
        if (location.empty()) location = "Seattle HQ";
        std::string phone = extractJsonField(jsonInput, "phone");
        std::string status = extractJsonField(jsonInput, "status");
        if (status.empty()) status = "Active";

        if (name.empty() || email.empty()) {
            return "{\"success\":false,\"error\":\"Name and email are required fields\"}";
        }

        sqlite3_stmt* checkStmt = nullptr;
        if (sqlite3_prepare_v2(db, "SELECT id FROM users WHERE lower(email) = lower(?);", -1, &checkStmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(checkStmt, 1, email.c_str(), -1, SQLITE_STATIC);
            if (sqlite3_step(checkStmt) == SQLITE_ROW) {
                sqlite3_finalize(checkStmt);
                return "{\"success\":false,\"error\":\"A user with this email address already exists\"}";
            }
            sqlite3_finalize(checkStmt);
        }

        auto start = std::chrono::high_resolution_clock::now();
        std::string newId = "u_staff_" + std::to_string(std::chrono::duration_cast<std::chrono::nanoseconds>(start.time_since_epoch()).count());
        std::string staffId = generateNextStaffId();

        sqlite3_stmt* stmt = nullptr;
        std::string sql = "INSERT INTO users (id, staff_id, name, email, password, role, status, department, location, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'Staff', ?, ?, ?, ?, datetime('now'), datetime('now'));";

        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Failed to prepare insert statement\"}";
        }

        sqlite3_bind_text(stmt, 1, newId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, staffId.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 3, name.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, email.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 5, password.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 6, status.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 7, department.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 8, location.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 9, phone.c_str(), -1, SQLITE_TRANSIENT);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc != SQLITE_DONE) {
            return "{\"success\":false,\"error\":\"" + std::string(sqlite3_errmsg(db)) + "\"}";
        }

        logActivity(newId, "System Administrator", "Staff Created", "Created staff " + name + " (" + staffId + ")");

        auto end = std::chrono::high_resolution_clock::now();
        double elapsedUs = std::chrono::duration<double, std::micro>(end - start).count();

        std::ostringstream ss;
        ss << "{\"success\":true,\"staff_id\":\"" << staffId << "\",\"execution_time_us\":" << elapsedUs << ",\"user\":" << getUserStatus(newId) << "}";
        return ss.str();
    }

    std::string updateUser(const std::string& callerId, const std::string& targetUserId, const std::string& jsonInput) {
        bool isAdmin = isCallerAdmin(callerId);
        if (!isAdmin && callerId != targetUserId) {
            return "{\"success\":false,\"error\":\"Unauthorized: Staff can only view or update their own profile.\"}";
        }

        std::string name = extractJsonField(jsonInput, "name");
        std::string email = extractJsonField(jsonInput, "email");
        std::string password = extractJsonField(jsonInput, "password");
        std::string department = extractJsonField(jsonInput, "department");
        std::string location = extractJsonField(jsonInput, "location");
        std::string phone = extractJsonField(jsonInput, "phone");
        std::string status = extractJsonField(jsonInput, "status");

        sqlite3_stmt* stmt = nullptr;
        std::string sql;
        if (isAdmin) {
            sql = "UPDATE users SET name=?, email=?, department=?, location=?, phone=?, status=?, updated_at=datetime('now') WHERE id=?;";
        } else {
            sql = "UPDATE users SET phone=?, updated_at=datetime('now') WHERE id=?;";
        }

        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Prepare failed\"}";
        }

        if (isAdmin) {
            sqlite3_bind_text(stmt, 1, name.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 3, department.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 4, location.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 5, phone.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 6, status.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 7, targetUserId.c_str(), -1, SQLITE_TRANSIENT);
        } else {
            sqlite3_bind_text(stmt, 1, phone.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 2, targetUserId.c_str(), -1, SQLITE_TRANSIENT);
        }

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc != SQLITE_DONE) {
            return "{\"success\":false,\"error\":\"Update failed: " + std::string(sqlite3_errmsg(db)) + "\"}";
        }

        if (!password.empty()) {
            sqlite3_stmt* pwdStmt = nullptr;
            std::string pwdSql = "UPDATE users SET password = ? WHERE id = ?;";
            if (sqlite3_prepare_v2(db, pwdSql.c_str(), -1, &pwdStmt, nullptr) == SQLITE_OK) {
                sqlite3_bind_text(pwdStmt, 1, password.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(pwdStmt, 2, targetUserId.c_str(), -1, SQLITE_TRANSIENT);
                sqlite3_step(pwdStmt);
                sqlite3_finalize(pwdStmt);
            }
        }

        logActivity(targetUserId, isAdmin ? "System Administrator" : name, "Profile Updated", "Profile details updated in directory");

        return "{\"success\":true,\"user\":" + getUserStatus(targetUserId) + "}";
    }

    std::string deleteUser(const std::string& callerId, const std::string& targetUserId) {
        if (!isCallerAdmin(callerId)) {
            return "{\"success\":false,\"error\":\"Unauthorized: Only System Administrator can delete users.\"}";
        }

        if (targetUserId == "u_admin_sole") {
            return "{\"success\":false,\"error\":\"Cannot delete the sole System Administrator.\"}";
        }

        sqlite3_stmt* stmt = nullptr;
        std::string sql = "DELETE FROM users WHERE id = ?;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Prepare failed\"}";
        }
        sqlite3_bind_text(stmt, 1, targetUserId.c_str(), -1, SQLITE_STATIC);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc == SQLITE_DONE) {
            logActivity(targetUserId, "System Administrator", "User Deleted", "User deleted from corporate directory");
            return "{\"success\":true}";
        } else {
            return "{\"success\":false,\"error\":\"Delete execution failed\"}";
        }
    }

    std::string listDepartments() {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT d.id, d.name, d.code, d.manager, (SELECT COUNT(*) FROM users u WHERE u.department = d.name) as current_headcount FROM departments d;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "[]";
        }

        std::ostringstream ss;
        ss << "[";
        bool first = true;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) ss << ",";
            first = false;
            ss << "{";
            ss << "\"id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 0)) << "\",";
            ss << "\"name\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 1)) << "\",";
            ss << "\"code\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 2)) << "\",";
            ss << "\"manager\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 3)) << "\",";
            ss << "\"headcount\":" << sqlite3_column_int(stmt, 4);
            ss << "}";
        }
        sqlite3_finalize(stmt);
        ss << "]";
        return ss.str();
    }

    std::string listLocations() {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT l.id, l.name, l.city, l.country, l.address, l.timezone, (SELECT COUNT(*) FROM users u WHERE u.location = l.name) as user_count FROM locations l;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "[]";
        }

        std::ostringstream ss;
        ss << "[";
        bool first = true;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) ss << ",";
            first = false;
            ss << "{";
            ss << "\"id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 0)) << "\",";
            ss << "\"name\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 1)) << "\",";
            ss << "\"city\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 2)) << "\",";
            ss << "\"country\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 3)) << "\",";
            ss << "\"address\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 4)) << "\",";
            ss << "\"timezone\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 5)) << "\",";
            ss << "\"user_count\":" << sqlite3_column_int(stmt, 6);
            ss << "}";
        }
        sqlite3_finalize(stmt);
        ss << "]";
        return ss.str();
    }

    std::string getActivityLogs() {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT id, user_id, actor_name, action, description, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 50;";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "[]";
        }

        std::ostringstream ss;
        ss << "[";
        bool first = true;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            if (!first) ss << ",";
            first = false;
            ss << "{";
            ss << "\"id\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 0)) << "\",";
            const char* uid = (const char*)sqlite3_column_text(stmt, 1);
            ss << "\"user_id\":\"" << (uid ? escapeJson(uid) : "") << "\",";
            ss << "\"actor_name\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 2)) << "\",";
            ss << "\"action\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 3)) << "\",";
            const char* desc = (const char*)sqlite3_column_text(stmt, 4);
            ss << "\"description\":\"" << (desc ? escapeJson(desc) : "") << "\",";
            ss << "\"created_at\":\"" << escapeJson((const char*)sqlite3_column_text(stmt, 5)) << "\"";
            ss << "}";
        }
        sqlite3_finalize(stmt);
        ss << "]";
        return ss.str();
    }

    void logActivity(const std::string& userId, const std::string& actorName, const std::string& action, const std::string& desc) {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "INSERT INTO activity_logs (id, user_id, actor_name, action, description, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'));";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            std::string logId = "act_" + std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::high_resolution_clock::now().time_since_epoch()).count());
            sqlite3_bind_text(stmt, 1, logId.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 2, userId.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 3, actorName.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 4, action.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(stmt, 5, desc.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_step(stmt);
            sqlite3_finalize(stmt);
        }
    }

    std::string getDashboardOverview() {
        int staffCount = 0;
        int activeCount = 0;
        int deptCount = 0;
        int locCount = 0;

        sqlite3_stmt* stmt = nullptr;
        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users WHERE role = 'Staff';", -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) staffCount = sqlite3_column_int(stmt, 0);
            sqlite3_finalize(stmt);
        }

        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM users WHERE status = 'Active';", -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) activeCount = sqlite3_column_int(stmt, 0);
            sqlite3_finalize(stmt);
        }

        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM departments;", -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) deptCount = sqlite3_column_int(stmt, 0);
            sqlite3_finalize(stmt);
        }

        if (sqlite3_prepare_v2(db, "SELECT COUNT(*) FROM locations;", -1, &stmt, nullptr) == SQLITE_OK) {
            if (sqlite3_step(stmt) == SQLITE_ROW) locCount = sqlite3_column_int(stmt, 0);
            sqlite3_finalize(stmt);
        }

        std::ostringstream ss;
        ss << "{";
        ss << "\"total_staff\":" << staffCount << ",";
        ss << "\"active_users\":" << activeCount << ",";
        ss << "\"departments_count\":" << deptCount << ",";
        ss << "\"locations_count\":" << locCount << ",";
        ss << "\"storage_engine\":\"Proton C++ Core v2.5.0 Windows Edition\",";
        ss << "\"os\":\"Microsoft Windows (Win32/Win64 Native)\",";
        ss << "\"journal_mode\":\"WAL\",";
        ss << "\"system_administrator\":\"kanithisaikiran3036@gmail.com\"";
        ss << "}";
        return ss.str();
    }

    std::string createResetCode(const std::string& email, const std::string& code, int expiresInSeconds = 600) {
        long long expiresAt = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count() + expiresInSeconds;

        execute("DELETE FROM password_resets WHERE lower(email) = lower('" + email + "');");

        sqlite3_stmt* stmt = nullptr;
        std::string sql = "INSERT INTO password_resets (email, code, expires_at, created_at, attempts) VALUES (?, ?, ?, datetime('now'), 0);";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Failed to store verification code\"}";
        }

        sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 2, code.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_int64(stmt, 3, expiresAt);

        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc == SQLITE_DONE) {
            return "{\"success\":true,\"expires_at\":" + std::to_string(expiresAt) + "}";
        } else {
            return "{\"success\":false,\"error\":\"Failed to save verification code\"}";
        }
    }

    std::string verifyResetCode(const std::string& email, const std::string& code) {
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "SELECT code, expires_at, attempts FROM password_resets WHERE lower(email) = lower(?);";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Database error\"}";
        }

        sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);

        std::string storedCode = "";
        long long expiresAt = 0;
        int attempts = 0;
        bool found = false;

        if (sqlite3_step(stmt) == SQLITE_ROW) {
            storedCode = (const char*)sqlite3_column_text(stmt, 0);
            expiresAt = sqlite3_column_int64(stmt, 1);
            attempts = sqlite3_column_int(stmt, 2);
            found = true;
        }
        sqlite3_finalize(stmt);

        if (!found) {
            return "{\"success\":false,\"error\":\"No active password reset request found for this email address\"}";
        }

        if (attempts >= 5) {
            return "{\"success\":false,\"error\":\"Too many failed attempts. Please request a new verification code.\"}";
        }

        long long now = std::chrono::duration_cast<std::chrono::seconds>(
            std::chrono::system_clock::now().time_since_epoch()
        ).count();

        if (now > expiresAt) {
            return "{\"success\":false,\"error\":\"Verification code has expired. Please request a new code.\"}";
        }

        if (storedCode != code) {
            execute("UPDATE password_resets SET attempts = attempts + 1 WHERE lower(email) = lower('" + email + "');");
            return "{\"success\":false,\"error\":\"Invalid verification code. Please check your email and try again.\"}";
        }

        return "{\"success\":true,\"valid\":true}";
    }

    std::string resetPassword(const std::string& email, const std::string& code, const std::string& newPassword) {
        if (newPassword.length() < 6) {
            return "{\"success\":false,\"error\":\"Password must be at least 6 characters long\"}";
        }

        std::string verifyResult = verifyResetCode(email, code);
        if (verifyResult.find("\"success\":true") == std::string::npos) {
            return verifyResult;
        }

        sqlite3_stmt* stmt = nullptr;
        std::string sql = "UPDATE users SET password = ?, updated_at = datetime('now') WHERE lower(email) = lower(?);";
        if (sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr) != SQLITE_OK) {
            return "{\"success\":false,\"error\":\"Failed to prepare password update\"}";
        }
        sqlite3_bind_text(stmt, 1, newPassword.c_str(), -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 2, email.c_str(), -1, SQLITE_STATIC);
        int rc = sqlite3_step(stmt);
        sqlite3_finalize(stmt);

        if (rc != SQLITE_DONE) {
            return "{\"success\":false,\"error\":\"Failed to update password in database\"}";
        }

        execute("DELETE FROM password_resets WHERE lower(email) = lower('" + email + "');");

        std::string infoSql = "SELECT id, name, role FROM users WHERE lower(email) = lower(?);";
        if (sqlite3_prepare_v2(db, infoSql.c_str(), -1, &stmt, nullptr) == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, email.c_str(), -1, SQLITE_STATIC);
            if (sqlite3_step(stmt) == SQLITE_ROW) {
                std::string userId = (const char*)sqlite3_column_text(stmt, 0);
                std::string name = (const char*)sqlite3_column_text(stmt, 1);
                std::string role = (const char*)sqlite3_column_text(stmt, 2);
                logActivity(userId, name, "Password Reset", "Password reset completed via email verification code for " + name + " (" + role + ")");
            }
            sqlite3_finalize(stmt);
        }

        return "{\"success\":true,\"message\":\"Password successfully reset! You can now sign in with your new credentials.\"}";
    }

    std::string getEngineStatus() {
        std::ostringstream ss;
        ss << "{";
        ss << "\"engine_version\":\"Proton C++ v2.5.0 Windows Native\",";
        ss << "\"platform_os\":\"Microsoft Windows (Win32/Win64 Native)\",";
#if defined(_MSC_VER)
        ss << "\"compiler\":\"Microsoft Visual C++ (MSVC " << _MSC_VER << ")\",";
#elif defined(__MINGW64__)
        ss << "\"compiler\":\"MinGW-w64 GCC " << __VERSION__ << "\",";
#elif defined(__clang__)
        ss << "\"compiler\":\"Clang/LLVM for Windows (" << __clang_version__ << ")\",";
#else
        ss << "\"compiler\":\"Windows C++17 Compiler\",";
#endif
        ss << "\"windows_compatible\":true,";
        ss << "\"sqlite_version\":\"" << sqlite3_libversion() << "\",";
        ss << "\"journal_mode\":\"WAL\",";
        ss << "\"cache_size_mb\":64,";
        ss << "\"status\":\"OPTIMAL\",";
        ss << "\"access_control\":\"Sole Admin Only Staff Creation\"";
        ss << "}";
        return ss.str();
    }

    std::string runBenchmark(int iterations = 1000) {
        auto start = std::chrono::high_resolution_clock::now();
        execute("BEGIN TRANSACTION;");
        sqlite3_stmt* stmt = nullptr;
        std::string sql = "INSERT INTO users (id, staff_id, name, email, password, role, status, department, location, created_at, updated_at) VALUES (?, ?, ?, ?, 'benchpwd', 'Staff', 'Active', 'Engineering', 'Seattle HQ', datetime('now'), datetime('now'));";
        sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);

        for (int i = 0; i < iterations; ++i) {
            std::string bid = "bench_user_" + std::to_string(i) + "_" + std::to_string(std::chrono::duration_cast<std::chrono::nanoseconds>(start.time_since_epoch()).count());
            std::string bstaff = "STF-" + std::to_string(9000 + i);
            std::string bname = "Benchmark Staff " + std::to_string(i);
            std::string bemail = "bench" + std::to_string(i) + "@proton.perf";

            sqlite3_bind_text(stmt, 1, bid.c_str(), -1, SQLITE_STATIC);
            sqlite3_bind_text(stmt, 2, bstaff.c_str(), -1, SQLITE_STATIC);
            sqlite3_bind_text(stmt, 3, bname.c_str(), -1, SQLITE_STATIC);
            sqlite3_bind_text(stmt, 4, bemail.c_str(), -1, SQLITE_STATIC);

            sqlite3_step(stmt);
            sqlite3_reset(stmt);
        }
        sqlite3_finalize(stmt);
        execute("COMMIT;");
        auto endInserts = std::chrono::high_resolution_clock::now();

        execute("DELETE FROM users WHERE id LIKE 'bench_user_%';");

        double insertDurationMs = std::chrono::duration<double, std::milli>(endInserts - start).count();
        double insertOpsSec = (iterations / (insertDurationMs / 1000.0));
        double avgLatencyUs = (insertDurationMs * 1000.0) / iterations;

        std::ostringstream ss;
        ss << "{";
        ss << "\"iterations\":" << iterations << ",";
        ss << "\"insert_duration_ms\":" << insertDurationMs << ",";
        ss << "\"insert_ops_per_sec\":" << static_cast<long>(insertOpsSec) << ",";
        ss << "\"avg_write_latency_us\":" << avgLatencyUs << ",";
        ss << "\"journal_mode\":\"WAL\",";
        ss << "\"storage_engine\":\"Proton C++ Core v2.5.0 Windows Native Edition\"";
        ss << "}";
        return ss.str();
    }
};

} // namespace ProtonWindowsCore

// Windows Stdin Reader: Handles both Windows CRLF (\r\n) and Unix LF (\n)
static inline std::string readWindowsStdinAll() {
    std::string result;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (!line.empty() && line.back() == '\r') {
            line.pop_back();
        }
        result += line;
    }
    return result;
}

int main(int argc, char* argv[]) {
    // Initialize Windows Console for UTF-8 Output & Input
    SetConsoleOutputCP(CP_UTF8);
    SetConsoleCP(CP_UTF8);

    std::string dbPath = "proton_directory.db";
    for (int i = 1; i < argc; ++i) {
        if (std::string(argv[i]) == "--db" && i + 1 < argc) {
            dbPath = argv[i+1];
        }
    }

    ProtonWindowsCore::Database db(dbPath);
    if (!db.open()) {
        std::cout << "{\"error\":\"Failed to initialize Windows database\"}" << std::endl;
        return 1;
    }

    if (argc < 2) {
        std::cout << "{\"error\":\"Usage: proton_core_engine.exe <command> [args]\"}" << std::endl;
        return 1;
    }

    std::string command = argv[1];

    if (command == "status") {
        std::cout << db.getEngineStatus() << std::endl;
    } else if (command == "overview") {
        std::cout << db.getDashboardOverview() << std::endl;
    } else if (command == "login") {
        std::string email = (argc > 2) ? argv[2] : "";
        std::string password = (argc > 3) ? argv[3] : "";
        std::cout << db.authenticateUser(email, password) << std::endl;
    } else if (command == "list_users") {
        std::string search = (argc > 2) ? argv[2] : "";
        std::cout << db.listUsers(search) << std::endl;
    } else if (command == "user_status") {
        std::string userId = (argc > 2) ? argv[2] : "";
        std::cout << db.getUserStatus(userId) << std::endl;
    } else if (command == "create_staff") {
        std::string callerId = (argc > 2) ? argv[2] : "";
        std::string json = (argc > 3) ? argv[3] : readWindowsStdinAll();
        std::cout << db.createStaff(callerId, json) << std::endl;
    } else if (command == "update_user") {
        std::string callerId = (argc > 2) ? argv[2] : "";
        std::string targetId = (argc > 3) ? argv[3] : "";
        std::string json = (argc > 4) ? argv[4] : readWindowsStdinAll();
        std::cout << db.updateUser(callerId, targetId, json) << std::endl;
    } else if (command == "delete_user") {
        std::string callerId = (argc > 2) ? argv[2] : "";
        std::string targetId = (argc > 3) ? argv[3] : "";
        std::cout << db.deleteUser(callerId, targetId) << std::endl;
    } else if (command == "departments") {
        std::cout << db.listDepartments() << std::endl;
    } else if (command == "locations") {
        std::cout << db.listLocations() << std::endl;
    } else if (command == "activity") {
        std::cout << db.getActivityLogs() << std::endl;
    } else if (command == "create_reset_code") {
        std::string email = (argc > 2) ? argv[2] : "";
        std::string code = (argc > 3) ? argv[3] : "";
        int expiresIn = (argc > 4) ? std::stoi(argv[4]) : 600;
        std::cout << db.createResetCode(email, code, expiresIn) << std::endl;
    } else if (command == "verify_reset_code") {
        std::string email = (argc > 2) ? argv[2] : "";
        std::string code = (argc > 3) ? argv[3] : "";
        std::cout << db.verifyResetCode(email, code) << std::endl;
    } else if (command == "reset_password") {
        std::string email = (argc > 2) ? argv[2] : "";
        std::string code = (argc > 3) ? argv[3] : "";
        std::string newPassword = (argc > 4) ? argv[4] : "";
        std::cout << db.resetPassword(email, code, newPassword) << std::endl;
    } else if (command == "benchmark") {
        int iters = (argc > 2) ? std::stoi(argv[2]) : 1000;
        std::cout << db.runBenchmark(iters) << std::endl;
    } else {
        std::cout << "{\"error\":\"Unknown Windows engine command\"}" << std::endl;
        return 1;
    }

    return 0;
}
