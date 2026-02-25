import Foundation
import CryptoKit

class Validator {
    private static let emailRegex = try! NSRegularExpression(
        pattern: "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    )
    
    private static let usernameRegex = try! NSRegularExpression(
        pattern: "^[a-zA-Z0-9_]+$"
    )
    
    static func validateEmail(_ email: String) -> Bool {
        guard !email.isEmpty else {
            return false
        }
        
        let range = NSRange(location: 0, length: email.utf16.count)
        return emailRegex.firstMatch(in: email, options: [], range: range) != nil
    }
    
    static func hashPassword(_ password: String) throws -> String {
        guard password.count >= 8 else {
            throw ValidationError.passwordTooShort
        }
        
        let data = Data(password.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
    
    static func verifyPassword(_ password: String, hash: String) -> Bool {
        do {
            let computedHash = try hashPassword(password)
            return computedHash == hash
        } catch {
            return false
        }
    }
    
    static func sanitizeString(_ input: String) -> String {
        guard !input.isEmpty else {
            return ""
        }
        
        return input.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&#x27;")
    }
    
    static func validateUsername(_ username: String) -> Bool {
        guard !username.isEmpty else {
            return false
        }
        
        guard username.count >= 3 && username.count <= 20 else {
            return false
        }
        
        let range = NSRange(location: 0, length: username.utf16.count)
        return usernameRegex.firstMatch(in: username, options: [], range: range) != nil
    }
    
    static func validatePasswordStrength(_ password: String) -> Bool {
        guard password.count >= 8 else {
            return false
        }
        
        let hasUppercase = password.rangeOfCharacter(from: .uppercaseLetters) != nil
        let hasLowercase = password.rangeOfCharacter(from: .lowercaseLetters) != nil
        let hasDigit = password.rangeOfCharacter(from: .decimalDigits) != nil
        let hasSpecial = password.rangeOfCharacter(from: CharacterSet.alphanumerics.inverted) != nil
        
        let criteriaCount = [hasUppercase, hasLowercase, hasDigit, hasSpecial].filter { $0 }.count
        return criteriaCount >= 3
    }
}

enum ValidationError: Error {
    case passwordTooShort
    case invalidEmail
    case invalidUsername
}
