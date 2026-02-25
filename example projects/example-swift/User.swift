import Foundation

class User {
    private var id: Int?
    private var username: String = ""
    private var email: String = ""
    private var password: String = ""
    private var isActive: Bool = true
    
    init() {}
    
    func create(db: Database, username: String, email: String, password: String) throws -> Bool {
        guard !username.isEmpty && !email.isEmpty && !password.isEmpty else {
            throw UserError.missingFields
        }
        
        guard Validator.validateEmail(email) else {
            throw ValidationError.invalidEmail
        }
        
        let hashedPassword = try Validator.hashPassword(password)
        
        let data: [String: Any] = [
            "username": username,
            "email": email,
            "password": hashedPassword,
            "is_active": isActive ? 1 : 0
        ]
        
        if db.insert(table: "users", data: data) {
            self.username = username
            self.email = email
            self.password = hashedPassword
            return true
        }
        
        return false
    }
    
    func findById(db: Database, id: Int) throws -> User? {
        guard id > 0 else {
            throw UserError.invalidId
        }
        
        let sql = "SELECT * FROM users WHERE id = ?"
        guard let result = db.query(sql: sql, params: [id]), !result.isEmpty else {
            return nil
        }
        
        let userData = result[0]
        self.id = userData["id"] as? Int
        self.username = userData["username"] as? String ?? ""
        self.email = userData["email"] as? String ?? ""
        self.isActive = (userData["is_active"] as? Int) == 1
        
        return self
    }
    
    func update(db: Database, username: String? = nil, email: String? = nil) throws -> Bool {
        guard id != nil else {
            throw UserError.notLoaded
        }
        
        var updates: [String: Any] = [:]
        
        if let uname = username, !uname.isEmpty {
            updates["username"] = uname
        }
        
        if let em = email, !em.isEmpty {
            guard Validator.validateEmail(em) else {
                throw ValidationError.invalidEmail
            }
            updates["email"] = em
        }
        
        guard !updates.isEmpty else {
            return false
        }
        
        return db.update(table: "users", data: updates, whereClause: "id = \(id!)")
    }
    
    func delete(db: Database) throws -> Bool {
        guard id != nil else {
            throw UserError.notLoaded
        }
        
        return db.update(table: "users", data: ["is_active": 0], whereClause: "id = \(id!)")
    }
    
    func getUsername() -> String {
        return username
    }
    
    func getEmail() -> String {
        return email
    }
    
    func getIsActive() -> Bool {
        return isActive
    }
}

enum UserError: Error {
    case missingFields
    case invalidId
    case notLoaded
}
