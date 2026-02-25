#include <string>
#include <map>
#include <stdexcept>
#include "Database.hpp"

namespace App {

class User {
private:
    int id;
    std::string username;
    std::string email;
    std::string password;
    bool isActive;

public:
    User() : id(0), isActive(true) {}

    bool create(Database& db, const std::string& uname, const std::string& em, const std::string& pass) {
        if (uname.empty() || em.empty() || pass.empty()) {
            throw std::invalid_argument("All fields are required");
        }
        
        // Validate email (simplified)
        if (em.find('@') == std::string::npos) {
            throw std::invalid_argument("Invalid email format");
        }
        
        // Hash password (simplified)
        std::string hashedPassword = "hashed_" + pass;
        
        std::map<std::string, std::string> data;
        data["username"] = uname;
        data["email"] = em;
        data["password"] = hashedPassword;
        data["is_active"] = isActive ? "1" : "0";
        
        if (db.insert("users", data)) {
            username = uname;
            email = em;
            password = hashedPassword;
            return true;
        }
        
        return false;
    }

    bool findById(Database& db, int userId) {
        if (userId <= 0) {
            throw std::invalid_argument("Invalid user ID");
        }
        
        std::string sql = "SELECT * FROM users WHERE id = ?";
        auto result = db.query(sql, {std::to_string(userId)});
        
        if (!result.empty()) {
            auto userData = result[0];
            id = userId;
            username = userData["username"];
            email = userData["email"];
            isActive = userData["is_active"] == "1";
            return true;
        }
        
        return false;
    }

    bool update(Database& db, const std::string* uname = nullptr, const std::string* em = nullptr) {
        if (id == 0) {
            throw std::runtime_error("User not loaded");
        }
        
        std::map<std::string, std::string> updates;
        
        if (uname != nullptr && !uname->empty()) {
            updates["username"] = *uname;
        }
        
        if (em != nullptr && !em->empty()) {
            if (em->find('@') == std::string::npos) {
                throw std::invalid_argument("Invalid email format");
            }
            updates["email"] = *em;
        }
        
        if (updates.empty()) {
            return false;
        }
        
        std::string whereClause = "id = " + std::to_string(id);
        return db.update("users", updates, whereClause);
    }

    bool deleteUser(Database& db) {
        if (id == 0) {
            throw std::runtime_error("User not loaded");
        }
        
        std::map<std::string, std::string> data;
        data["is_active"] = "0";
        
        std::string whereClause = "id = " + std::to_string(id);
        return db.update("users", data, whereClause);
    }

    std::string getUsername() const { return username; }
    std::string getEmail() const { return email; }
    bool getIsActive() const { return isActive; }
};

}
