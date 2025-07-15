-- Migration script for TTL and batch functionality in notifications table
-- Add TTL and batch tracking columns to notifications table

ALTER TABLE notifications 
ADD COLUMN expires_at TIMESTAMP NULL COMMENT 'When this notification expires (for TTL)',
ADD COLUMN batch_number INT NULL COMMENT 'Batch number for emergency responder notifications',
ADD COLUMN alert_id VARCHAR(36) NULL COMMENT 'Reference to the alert that triggered this notification';

-- Add indexes for efficient TTL and batch queries
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notifications_alert_id ON notifications(alert_id);
CREATE INDEX idx_notifications_batch_number ON notifications(batch_number);
CREATE INDEX idx_notifications_alert_type_status ON notifications(alert_id, type, status);

-- Update the user_id column to be VARCHAR(36) to match UUID format if not already done
-- ALTER TABLE notifications MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

-- Verify the structure
DESCRIBE notifications;
