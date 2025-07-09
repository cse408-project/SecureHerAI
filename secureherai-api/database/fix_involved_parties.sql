-- Fix for involved_parties column type mismatch
-- Run this in your PostgreSQL database to fix the existing table

ALTER TABLE incident_reports 
ALTER COLUMN involved_parties TYPE TEXT;
