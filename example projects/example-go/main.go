package main

import (
	"fmt"
	"./utils"
	"./database"
)

// User represents a user in the system
type User struct {
	ID       int
	Username string
	Email    string
	Password string
	IsActive bool
}

// UserManager handles user operations
type UserManager struct {
	db *database.Database
}

// NewUserManager creates a new user manager
func NewUserManager(db *database.Database) *UserManager {
	return &UserManager{db: db}
}

// CreateUser creates a new user with validation
func (um *UserManager) CreateUser(username, email, password string) (*User, error) {
	if username == "" || email == "" || password == "" {
		return nil, fmt.Errorf("all fields are required")
	}
	
	// Validate email
	if !utils.ValidateEmail(email) {
		return nil, fmt.Errorf("invalid email format")
	}
	
	// Hash password
	hashedPassword := utils.HashPassword(password)
	
	user := &User{
		Username: username,
		Email:    email,
		Password: hashedPassword,
		IsActive: true,
	}
	
	return user, nil
}

// GetUser retrieves a user by ID
func (um *UserManager) GetUser(id int) (*User, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid user ID")
	}
	
	// Simulate database query
	user := &User{
		ID:       id,
		Username: "testuser",
		Email:    "test@example.com",
		IsActive: true,
	}
	
	return user, nil
}

// UpdateUser updates user information
func (um *UserManager) UpdateUser(id int, username, email string) error {
	if id <= 0 {
		return fmt.Errorf("invalid user ID")
	}
	
	if username == "" && email == "" {
		return fmt.Errorf("nothing to update")
	}
	
	return nil
}

// DeleteUser soft deletes a user
func (um *UserManager) DeleteUser(id int) error {
	if id <= 0 {
		return fmt.Errorf("invalid user ID")
	}
	
	return nil
}

func main() {
	db := database.NewDatabase()
	manager := NewUserManager(db)
	
	user, err := manager.CreateUser("john", "john@example.com", "password123")
	if err != nil {
		fmt.Printf("Error creating user: %v\n", err)
		return
	}
	
	fmt.Printf("User created: %s\n", user.Username)
}
