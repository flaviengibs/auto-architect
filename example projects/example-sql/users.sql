-- User management database schema and stored procedures

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Stored procedure to create a new user
CREATE PROCEDURE IF NOT EXISTS sp_create_user(
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255)
)
BEGIN
    DECLARE v_count INTEGER;
    
    -- Check if username already exists
    SELECT COUNT(*) INTO v_count FROM users WHERE username = p_username;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists';
    END IF;
    
    -- Check if email already exists
    SELECT COUNT(*) INTO v_count FROM users WHERE email = p_email;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
    END IF;
    
    -- Insert new user
    INSERT INTO users (username, email, password, is_active)
    VALUES (p_username, p_email, p_password, 1);
    
    SELECT LAST_INSERT_ID() AS user_id;
END;

-- Stored procedure to get user by ID
CREATE PROCEDURE IF NOT EXISTS sp_get_user_by_id(
    IN p_user_id INTEGER
)
BEGIN
    SELECT id, username, email, is_active, created_at, updated_at
    FROM users
    WHERE id = p_user_id;
END;

-- Stored procedure to get user by email
CREATE PROCEDURE IF NOT EXISTS sp_get_user_by_email(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT id, username, email, is_active, created_at, updated_at
    FROM users
    WHERE email = p_email;
END;

-- Stored procedure to update user
CREATE PROCEDURE IF NOT EXISTS sp_update_user(
    IN p_user_id INTEGER,
    IN p_username VARCHAR(50),
    IN p_email VARCHAR(100)
)
BEGIN
    DECLARE v_count INTEGER;
    
    -- Check if user exists
    SELECT COUNT(*) INTO v_count FROM users WHERE id = p_user_id;
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User not found';
    END IF;
    
    -- Update user
    UPDATE users
    SET username = COALESCE(p_username, username),
        email = COALESCE(p_email, email),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END;

-- Stored procedure to soft delete user
CREATE PROCEDURE IF NOT EXISTS sp_delete_user(
    IN p_user_id INTEGER
)
BEGIN
    UPDATE users
    SET is_active = 0,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END;

-- Stored procedure to get active users
CREATE PROCEDURE IF NOT EXISTS sp_get_active_users()
BEGIN
    SELECT id, username, email, created_at, updated_at
    FROM users
    WHERE is_active = 1
    ORDER BY created_at DESC;
END;

-- Function to count active users
CREATE FUNCTION IF NOT EXISTS fn_count_active_users()
RETURNS INTEGER
DETERMINISTIC
BEGIN
    DECLARE v_count INTEGER;
    SELECT COUNT(*) INTO v_count FROM users WHERE is_active = 1;
    RETURN v_count;
END;

-- Function to validate email format
CREATE FUNCTION IF NOT EXISTS fn_validate_email(p_email VARCHAR(100))
RETURNS INTEGER
DETERMINISTIC
BEGIN
    IF p_email REGEXP '^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END;

-- Trigger to update timestamp on user modification
CREATE TRIGGER IF NOT EXISTS trg_users_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END;
