package utils

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
)

// ValidateEmail checks if email format is valid
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// HashPassword creates a SHA256 hash of the password
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// ValidateUsername checks if username is valid
func ValidateUsername(username string) bool {
	if len(username) < 3 || len(username) > 20 {
		return false
	}
	
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	return usernameRegex.MatchString(username)
}
