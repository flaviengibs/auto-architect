package com.example.app

import java.security.MessageDigest

object Validator {
    private val EMAIL_REGEX = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
    private val USERNAME_REGEX = Regex("^[a-zA-Z0-9_]+$")

    fun validateEmail(email: String): Boolean {
        if (email.isEmpty()) {
            return false
        }
        return EMAIL_REGEX.matches(email)
    }

    fun hashPassword(password: String): String {
        if (password.length < 8) {
            throw IllegalArgumentException("Password must be at least 8 characters")
        }

        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(password.toByteArray())
        return hash.joinToString("") { "%02x".format(it) }
    }

    fun verifyPassword(password: String, hash: String): Boolean {
        return try {
            hashPassword(password) == hash
        } catch (e: Exception) {
            false
        }
    }

    fun sanitizeString(input: String): String {
        if (input.isEmpty()) {
            return ""
        }

        return input.trim()
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#x27;")
    }

    fun validateUsername(username: String): Boolean {
        if (username.isEmpty()) {
            return false
        }

        if (username.length < 3 || username.length > 20) {
            return false
        }

        return USERNAME_REGEX.matches(username)
    }

    fun validatePasswordStrength(password: String): Boolean {
        if (password.length < 8) {
            return false
        }

        val hasUppercase = password.any { it.isUpperCase() }
        val hasLowercase = password.any { it.isLowerCase() }
        val hasDigit = password.any { it.isDigit() }
        val hasSpecial = password.any { !it.isLetterOrDigit() }

        return listOf(hasUppercase, hasLowercase, hasDigit, hasSpecial).count { it } >= 3
    }
}
