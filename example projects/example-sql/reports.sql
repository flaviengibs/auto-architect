-- Reporting queries and views

-- Create activity log table
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_log(created_at);

-- Stored procedure to log user activity
CREATE PROCEDURE IF NOT EXISTS sp_log_activity(
    IN p_user_id INTEGER,
    IN p_action VARCHAR(50),
    IN p_details TEXT
)
BEGIN
    INSERT INTO activity_log (user_id, action, details)
    VALUES (p_user_id, p_action, p_details);
END;

-- View for recent activity
CREATE VIEW IF NOT EXISTS vw_recent_activity AS
SELECT 
    a.id,
    a.user_id,
    u.username,
    u.email,
    a.action,
    a.details,
    a.created_at
FROM activity_log a
INNER JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 100;

-- Stored procedure for activity report
CREATE PROCEDURE IF NOT EXISTS sp_activity_report(
    IN p_user_id INTEGER,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        action,
        COUNT(*) AS action_count,
        MIN(created_at) AS first_occurrence,
        MAX(created_at) AS last_occurrence
    FROM activity_log
    WHERE user_id = p_user_id
    AND created_at BETWEEN p_start_date AND p_end_date
    GROUP BY action
    ORDER BY action_count DESC;
END;
