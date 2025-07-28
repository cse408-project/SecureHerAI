-- Migration: Create UserDevice table for FCM token management
-- Description: Creates the user_device table to store FCM tokens for push notifications
-- Date: 2024-07-28
-- Version: 1.0

-- Create the user_device table
CREATE TABLE IF NOT EXISTS user_device (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    fcm_token VARCHAR(255) NOT NULL UNIQUE,
    device_type VARCHAR(50) NOT NULL DEFAULT 'WEB_BROWSER',
    device_name VARCHAR(100),
    browser_info TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (assuming users table exists)
    CONSTRAINT fk_user_device_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Check constraint for device_type
    CONSTRAINT chk_device_type 
        CHECK (device_type IN ('WEB_BROWSER', 'MOBILE_APP', 'DESKTOP_APP'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_device_user_id ON user_device(user_id);
CREATE INDEX IF NOT EXISTS idx_user_device_fcm_token ON user_device(fcm_token);
CREATE INDEX IF NOT EXISTS idx_user_device_is_active ON user_device(is_active);
CREATE INDEX IF NOT EXISTS idx_user_device_user_id_active ON user_device(user_id, is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_device_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_user_device_updated_at ON user_device;
CREATE TRIGGER trigger_user_device_updated_at
    BEFORE UPDATE ON user_device
    FOR EACH ROW
    EXECUTE FUNCTION update_user_device_updated_at();

-- Add comments for documentation
COMMENT ON TABLE user_device IS 'Stores FCM tokens for push notifications to user devices';
COMMENT ON COLUMN user_device.id IS 'Primary key for the user device record';
COMMENT ON COLUMN user_device.user_id IS 'Foreign key reference to the user who owns this device';
COMMENT ON COLUMN user_device.fcm_token IS 'Firebase Cloud Messaging token for push notifications';
COMMENT ON COLUMN user_device.device_type IS 'Type of device (WEB_BROWSER, MOBILE_APP, DESKTOP_APP)';
COMMENT ON COLUMN user_device.device_name IS 'Human-readable name for the device';
COMMENT ON COLUMN user_device.browser_info IS 'Browser information for web devices';
COMMENT ON COLUMN user_device.is_active IS 'Whether this device is currently active for notifications';
COMMENT ON COLUMN user_device.created_at IS 'Timestamp when the device was first registered';
COMMENT ON COLUMN user_device.updated_at IS 'Timestamp when the device record was last updated';
COMMENT ON COLUMN user_device.last_used_at IS 'Timestamp when the device was last used for notifications';
