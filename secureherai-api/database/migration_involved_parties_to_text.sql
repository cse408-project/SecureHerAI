-- Database Migration: Change involved_parties column type from JSONB to TEXT
-- Run this migration in your PostgreSQL database before testing the application

-- Step 1: Create a backup of the current data (optional but recommended)
-- You can uncomment the following line to create a backup table:
-- CREATE TABLE incident_reports_backup AS SELECT * FROM incident_reports;

-- Step 2: Convert JSONB data to TEXT and update the column type
-- First, convert existing JSONB data to TEXT format
UPDATE incident_reports 
SET involved_parties = involved_parties::text 
WHERE involved_parties IS NOT NULL;

-- Step 3: Change the column type from JSONB to TEXT
ALTER TABLE incident_reports 
ALTER COLUMN involved_parties TYPE TEXT USING involved_parties::text;

-- Step 4: Verify the change (optional - remove the comment to run)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'incident_reports' AND column_name = 'involved_parties';

-- Migration completed successfully!
-- The involved_parties column is now TEXT type and can store JSON strings.
