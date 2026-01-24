-- Migration to update alerts_status_check constraint to include new WAITING, ACTIVE, FINISHED values
-- This is necessary because the AlertStatus enum was updated with new values

-- First, drop the old constraint if it exists
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_status_check;

-- Create the new constraint with all valid AlertStatus values
ALTER TABLE alerts ADD CONSTRAINT alerts_status_check 
CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED', 'DELETED', 'EXPIRED'));

-- Note: If using Flyway or similar, this will run automatically
-- If not using Flyway, run this SQL manually against your database:
-- docker exec -it secureherai_db psql -U postgres -d secureherai -f /path/to/this/file.sql

-- Or run directly:
-- ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_status_check;
-- ALTER TABLE alerts ADD CONSTRAINT alerts_status_check CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED', 'DELETED', 'EXPIRED'));
