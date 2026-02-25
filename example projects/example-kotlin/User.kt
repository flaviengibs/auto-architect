package com.example.app

data class User(
    var id: Int? = null,
    var username: String = "",
    var email: String = "",
    private var password: String = "",
    var isActive: Boolean = true
) {
    fun create(db: Database, username: String, email: String, password: String): Boolean {
        if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
            throw IllegalArgumentException("All fields are required")
        }

        if (!Validator.validateEmail(email)) {
            throw IllegalArgumentException("Invalid email format")
        }

        val hashedPassword = Validator.hashPassword(password)

        val data = mapOf(
            "username" to username,
            "email" to email,
            "password" to hashedPassword,
            "is_active" to if (isActive) 1 else 0
        )

        return if (db.insert("users", data)) {
            this.username = username
            this.email = email
            this.password = hashedPassword
            true
        } else {
            false
        }
    }

    fun findById(db: Database, id: Int): User? {
        if (id <= 0) {
            throw IllegalArgumentException("Invalid user ID")
        }

        val sql = "SELECT * FROM users WHERE id = ?"
        val result = db.query(sql, listOf(id))

        return if (result != null && result.isNotEmpty()) {
            val userData = result[0]
            this.id = userData["id"] as? Int
            this.username = userData["username"] as? String ?: ""
            this.email = userData["email"] as? String ?: ""
            this.isActive = (userData["is_active"] as? Int) == 1
            this
        } else {
            null
        }
    }

    fun update(db: Database, username: String? = null, email: String? = null): Boolean {
        if (id == null) {
            throw IllegalStateException("User not loaded")
        }

        val updates = mutableMapOf<String, Any>()

        username?.let {
            if (it.isNotEmpty()) {
                updates["username"] = it
            }
        }

        email?.let {
            if (it.isNotEmpty()) {
                if (!Validator.validateEmail(it)) {
                    throw IllegalArgumentException("Invalid email format")
                }
                updates["email"] = it
            }
        }

        if (updates.isEmpty()) {
            return false
        }

        return db.update("users", updates, "id = $id")
    }

    fun delete(db: Database): Boolean {
        if (id == null) {
            throw IllegalStateException("User not loaded")
        }

        return db.update("users", mapOf("is_active" to 0), "id = $id")
    }

    fun getUsername(): String = username
    fun getEmail(): String = email
    fun isActive(): Boolean = isActive
}
