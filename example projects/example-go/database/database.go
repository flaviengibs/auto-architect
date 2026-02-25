package database

import (
	"fmt"
)

// Database represents a database connection
type Database struct {
	Host     string
	Port     int
	Username string
	Password string
	DBName   string
}

// NewDatabase creates a new database instance
func NewDatabase() *Database {
	return &Database{
		Host:     "localhost",
		Port:     5432,
		Username: "admin",
		Password: "password",
		DBName:   "myapp",
	}
}

// Connect establishes a database connection
func (db *Database) Connect() error {
	fmt.Printf("Connecting to %s:%d\n", db.Host, db.Port)
	return nil
}

// Query executes a SQL query
func (db *Database) Query(sql string) ([]map[string]interface{}, error) {
	if sql == "" {
		return nil, fmt.Errorf("empty query")
	}
	
	// Simulate query execution
	results := []map[string]interface{}{
		{"id": 1, "name": "test"},
	}
	
	return results, nil
}

// Close closes the database connection
func (db *Database) Close() error {
	fmt.Println("Closing database connection")
	return nil
}
