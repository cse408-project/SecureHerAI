-- Migration script to add notifications table
-- Run this script to add the notifications table to your existing database

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id           BINARY(16)   NOT NULL,               -- UUID as binary for foreign key
    type              VARCHAR(30)  NOT NULL,               -- notification type enum
    channel           VARCHAR(10)  NOT NULL,               -- 'IN_APP' or 'EMAIL' or 'BOTH'
    title             VARCHAR(100) NOT NULL,               -- brief headline
    message           TEXT         NOT NULL,               -- full body
    payload           JSON         NULL,                   -- extra data (e.g. { lat, lng, reportId })
    priority          INT          NOT NULL DEFAULT 0,     -- higher = more urgent
    status            VARCHAR(15)  NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'READ', 'FAILED'
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at           TIMESTAMP    NULL,
    read_at           TIMESTAMP    NULL,
    
    -- Indexes for performance
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_status (status),
    INDEX idx_notifications_created_at (created_at),
    INDEX idx_notifications_user_status (user_id, status),
    INDEX idx_notifications_user_type (user_id, type),
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add some sample data (optional - for testing)
-- You can remove this section if you don't want sample data

-- Note: Replace the UUIDs below with actual user IDs from your users table
-- INSERT INTO notifications (user_id, type, channel, title, message, priority) VALUES
-- (UNHEX(REPLACE('38ea8e59-3775-4102-9df5-10437583c5f3', '-', '')), 
--  'SYSTEM_NOTIFICATION', 'IN_APP', 
--  'Welcome to SecureHerAI', 
--  'Thank you for joining SecureHerAI. Your safety is our priority.', 
--  1);

-- Verify the table was created successfully
DESCRIBE notifications;

-- Check if the table is empty (should return 0 initially)
SELECT COUNT(*) as notification_count FROM notifications;
