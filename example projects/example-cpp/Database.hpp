#ifndef DATABASE_HPP
#define DATABASE_HPP

#include <string>
#include <vector>
#include <map>

namespace App {

class Database {
private:
    std::string connectionString;
    bool connected;

public:
    Database(const std::string& connStr);
    ~Database();
    
    bool connect();
    std::vector<std::map<std::string, std::string>> query(
        const std::string& sql, 
        const std::vector<std::string>& params = {}
    );
    bool insert(
        const std::string& table, 
        const std::map<std::string, std::string>& data
    );
    bool update(
        const std::string& table, 
        const std::map<std::string, std::string>& data,
        const std::string& whereClause
    );
    bool deleteRecord(
        const std::string& table, 
        const std::string& whereClause
    );
    void disconnect();
    bool isConnected() const;
};

}

#endif
