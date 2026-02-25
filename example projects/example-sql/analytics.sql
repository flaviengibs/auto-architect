-- Analytics and reporting queries

-- View for user statistics
CREATE VIEW IF NOT EXISTS vw_user_stats AS
SELECT 
    COUNT(*) AS total_users,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_users,
    SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) AS new_today
FROM users;

-- Stored procedure for user growth analysis
CREATE PROCEDURE IF NOT EXISTS sp_user_growth_report(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        DATE(created_at) AS registration_date,
        COUNT(*) AS new_users,
        SUM(COUNT(*)) OVER (ORDER BY DATE(created_at)) AS cumulative_users
    FROM users
    WHERE created_at BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(created_at)
    ORDER BY registration_date;
END;

-- Function to calculate user retention rate
CREATE FUNCTION IF NOT EXISTS fn_calculate_retention_rate(
    p_days INTEGER
)
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
    DECLARE v_total INTEGER;
    DECLARE v_active INTEGER;
    DECLARE v_rate DECIMAL(5,2);
    
    SELECT COUNT(*) INTO v_total
    FROM users
    WHERE created_at <= DATE_SUB(NOW(), INTERVAL p_days DAY);
    
    SELECT COUNT(*) INTO v_active
    FROM users
    WHERE created_at <= DATE_SUB(NOW(), INTERVAL p_days DAY)
    AND is_active = 1;
    
    IF v_total > 0 THEN
        SET v_rate = (v_active / v_total) * 100;
    ELSE
        SET v_rate = 0;
    END IF;
    
    RETURN v_rate;
END;
