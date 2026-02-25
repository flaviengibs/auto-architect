#include <string>
#include <regex>
#include <algorithm>
#include <stdexcept>

namespace App {

class Validator {
private:
    static const std::regex emailRegex;
    static const std::regex usernameRegex;

public:
    static bool validateEmail(const std::string& email) {
        if (email.empty()) {
            return false;
        }
        return std::regex_match(email, emailRegex);
    }

    static std::string hashPassword(const std::string& password) {
        if (password.length() < 8) {
            throw std::invalid_argument("Password must be at least 8 characters");
        }
        
        // Simple hash simulation
        return "hashed_" + password;
    }

    static bool verifyPassword(const std::string& password, const std::string& hash) {
        try {
            std::string computedHash = hashPassword(password);
            return computedHash == hash;
        } catch (...) {
            return false;
        }
    }

    static std::string sanitizeString(const std::string& input) {
        if (input.empty()) {
            return "";
        }
        
        std::string sanitized = input;
        
        // Trim whitespace
        sanitized.erase(0, sanitized.find_first_not_of(" \t\n\r"));
        sanitized.erase(sanitized.find_last_not_of(" \t\n\r") + 1);
        
        // Replace special characters
        size_t pos = 0;
        while ((pos = sanitized.find('<', pos)) != std::string::npos) {
            sanitized.replace(pos, 1, "&lt;");
            pos += 4;
        }
        
        pos = 0;
        while ((pos = sanitized.find('>', pos)) != std::string::npos) {
            sanitized.replace(pos, 1, "&gt;");
            pos += 4;
        }
        
        return sanitized;
    }

    static bool validateUsername(const std::string& username) {
        if (username.empty()) {
            return false;
        }
        
        if (username.length() < 3 || username.length() > 20) {
            return false;
        }
        
        return std::regex_match(username, usernameRegex);
    }

    static bool validatePasswordStrength(const std::string& password) {
        if (password.length() < 8) {
            return false;
        }
        
        bool hasUppercase = std::any_of(password.begin(), password.end(), ::isupper);
        bool hasLowercase = std::any_of(password.begin(), password.end(), ::islower);
        bool hasDigit = std::any_of(password.begin(), password.end(), ::isdigit);
        bool hasSpecial = std::any_of(password.begin(), password.end(), 
            [](char c) { return !std::isalnum(c); });
        
        int criteriaCount = hasUppercase + hasLowercase + hasDigit + hasSpecial;
        return criteriaCount >= 3;
    }
};

const std::regex Validator::emailRegex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
const std::regex Validator::usernameRegex("^[a-zA-Z0-9_]+$");

}
