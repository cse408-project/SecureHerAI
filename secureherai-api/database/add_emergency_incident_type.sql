-- Add 'emergency' to incident_type check constraint
-- This allows SOS-generated reports to have incident_type = 'emergency'

-- Drop the existing constraint
ALTER TABLE incident_reports DROP CONSTRAINT IF EXISTS incident_reports_incident_type_check;

-- Add the new constraint with 'emergency' included
ALTER TABLE incident_reports ADD CONSTRAINT incident_reports_incident_type_check 
    CHECK (incident_type IN ('harassment', 'theft', 'assault', 'emergency', 'other'));
