-- PostgreSQL Schema for SecureHerAI Application
-- Women's Safety Application with AI Integration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For password hashing

-- USERS AND AUTHENTICATION

-- User table with integrated notification preferences
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    date_of_birth DATE,
    profile_picture TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    oauth_provider TEXT,
    is_profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
    -- Notification preferences directly in users table
    email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    sms_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    contribution_points INTEGER NOT NULL DEFAULT 0,
    -- Password reset fields
    reset_token TEXT,
    reset_token_expiry TIMESTAMPTZ,
    -- Login code fields for email 2FA
    login_code TEXT,
    login_code_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- UserDetails fields
    is_account_non_expired BOOLEAN NOT NULL DEFAULT TRUE,
    is_account_non_locked BOOLEAN NOT NULL DEFAULT TRUE,
    is_credentials_non_expired BOOLEAN NOT NULL DEFAULT TRUE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (role IN ('USER', 'RESPONDER', 'ADMIN')),
    CHECK (contribution_points >= 0)
);

-- Responder information (extends users with role='RESPONDER')
CREATE TABLE responders (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    responder_type TEXT NOT NULL, -- police, medical, etc.
    badge_number TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'available', -- available, busy, off_duty
    current_latitude NUMERIC(9,6),
    current_longitude NUMERIC(9,6),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_status_update TIMESTAMPTZ DEFAULT NOW()
);

-- Trusted contacts
CREATE TABLE trusted_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    share_location BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, phone)
);

-- SOS ALERTS

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    address TEXT,
    trigger_method TEXT NOT NULL,
    alert_message TEXT,
    audio_recording TEXT, -- URL reference to stored audio
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    verification_status TEXT DEFAULT 'pending', -- pending, verified, rejected
    verification_confidence NUMERIC(5,4),
    canceled_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (trigger_method IN ('manual', 'voice', 'automatic')),
    CHECK (status IN ('active', 'canceled', 'resolved', 'expired'))
);

-- Alert responder assignments
CREATE TABLE alert_responders (
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES responders(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted', -- accepted, rejected, en_route, arrived
    eta TEXT,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    arrival_time TIMESTAMPTZ,
    notes TEXT,
    PRIMARY KEY (alert_id, responder_id)
);

-- Alert notifications
CREATE TABLE alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES trusted_contacts(id) ON DELETE SET NULL,
    recipient_type TEXT NOT NULL, -- trusted_contact, emergency_service
    recipient_name TEXT NOT NULL,
    status TEXT NOT NULL, -- notified, notified_of_cancellation, failed
    notification_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert verification details
CREATE TABLE alert_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    verification_method TEXT NOT NULL, -- voice_recognition, location_history, ai_analysis
    verified BOOLEAN,
    confidence NUMERIC(5,4),
    analysis_details JSONB, -- JSON containing analysis details
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- JOURNEY TRACKING

-- Journeys
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_latitude NUMERIC(9,6) NOT NULL,
    start_longitude NUMERIC(9,6) NOT NULL,
    start_address TEXT,
    dest_latitude NUMERIC(9,6) NOT NULL,
    dest_longitude NUMERIC(9,6) NOT NULL,
    dest_address TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    actual_arrival_time TIMESTAMPTZ,
    share_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    route_polyline TEXT,
    safety_rating NUMERIC(3,2),
    ended_at TIMESTAMPTZ,
    feedback_rating INTEGER,
    feedback_comments TEXT,
    CHECK (status IN ('active', 'ended', 'canceled'))
);

-- Journey location updates
CREATE TABLE journey_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    remaining_distance TEXT,
    updated_eta TIMESTAMPTZ,
    area_safety_rating NUMERIC(3,2)
);

-- Journey shared contacts
CREATE TABLE journey_shared_contacts (
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES trusted_contacts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'notified', -- notified, notified_of_arrival
    notification_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (journey_id, contact_id)
);

-- VOICE AND EMOTION ANALYSIS

-- Voice and emotion analysis
CREATE TABLE voice_emotion_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    transcription TEXT,
    detected_keywords JSONB NOT NULL DEFAULT '[]'::JSONB,
    primary_emotion TEXT,
    confidence NUMERIC(5,4), 
    intensity NUMERIC(5,4),
    secondary_emotions JSONB NOT NULL DEFAULT '[]'::JSONB,
    sentiment_score NUMERIC(5,4),
    action TEXT,
    analysis_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CHECK (intensity IS NULL OR (intensity >= 0 AND intensity <= 1)),
    CHECK (sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1))
);

-- -- HEAT MAP & SAFETY DATA

-- -- Safety reports from users
-- CREATE TABLE area_safety_reports (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--     latitude NUMERIC(9,6) NOT NULL,
--     longitude NUMERIC(9,6) NOT NULL,
--     safety_rating SMALLINT NOT NULL,
--     comment TEXT,
--     time_of_day TEXT,
--     categories JSONB NOT NULL DEFAULT '[]'::JSONB,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     CHECK (safety_rating >= 1 AND safety_rating <= 5)
-- );

-- -- Area risk data (aggregated)
-- CREATE TABLE area_risk_data (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     latitude NUMERIC(9,6) NOT NULL,
--     longitude NUMERIC(9,6) NOT NULL,
--     risk_level TEXT NOT NULL, -- low, medium, high, extreme
--     incident_count INTEGER DEFAULT 0,
--     last_incident_time TIMESTAMPTZ,
--     safety_score NUMERIC(3,2),
--     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     CHECK (risk_level IN ('low', 'medium', 'high', 'extreme'))
-- );

-- -- Safe routes
-- CREATE TABLE safe_routes (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     start_latitude NUMERIC(9,6) NOT NULL,
--     start_longitude NUMERIC(9,6) NOT NULL,
--     end_latitude NUMERIC(9,6) NOT NULL,
--     end_longitude NUMERIC(9,6) NOT NULL,
--     polyline TEXT NOT NULL,
--     safety_rating NUMERIC(3,2) NOT NULL,
--     distance TEXT NOT NULL,
--     duration TEXT NOT NULL,
--     travel_mode TEXT NOT NULL, -- walking, driving, cycling
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--     CHECK (travel_mode IN ('walking', 'driving', 'cycling'))
-- );

-- INCIDENT REPORTS

-- Incident reports
CREATE TABLE incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    address TEXT,
    incident_time TIMESTAMPTZ NOT NULL,
    visibility TEXT NOT NULL,
    anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'submitted',
    action_taken TEXT,
    involved_parties JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (alert_id), -- One incident report per alert
    CHECK (incident_type IN ('harassment', 'theft', 'assault', 'other')),
    CHECK (visibility IN ('public', 'officials_only', 'private')),
    CHECK (status IN ('submitted', 'under_review', 'resolved'))
);

-- Evidence for incident reports
CREATE TABLE report_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- image, video, audio
    file_size INTEGER,
    description TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (file_type IN ('image', 'video', 'audio', 'document'))
);

-- -- Report comments
-- CREATE TABLE report_comments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
--     author_id UUID REFERENCES users(id),
--     author_name TEXT NOT NULL,
--     text TEXT NOT NULL,
--     is_official BOOLEAN NOT NULL DEFAULT FALSE,
--     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- AI CHAT HELPER

-- Chat history
CREATE TABLE ai_chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    suggested_actions JSONB, -- JSON array of suggested actions
    safety_tips JSONB, -- JSON array of safety tips
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SYSTEM SETTINGS

-- System settings (singleton table)
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    voice_detection_sensitivity NUMERIC(3,2) NOT NULL DEFAULT 0.8,
    emotion_detection_sensitivity NUMERIC(3,2) NOT NULL DEFAULT 0.7,
    heatmap_update_frequency TEXT NOT NULL DEFAULT 'hourly',
    data_retention_days INTEGER NOT NULL DEFAULT 90,
    emergency_number TEXT NOT NULL DEFAULT '999',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT singleton_system_settings CHECK (id = 1)
);

-- Create indexes for performance optimization

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- Location-based queries
CREATE INDEX idx_alerts_location ON alerts(latitude, longitude);
CREATE INDEX idx_journeys_locations ON journeys(start_latitude, start_longitude, dest_latitude, dest_longitude);
-- CREATE INDEX idx_area_safety_reports_location ON area_safety_reports(latitude, longitude);

-- Status queries
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_journeys_status ON journeys(status);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_responder_status ON responders(status);

-- Foreign key lookups
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_journeys_user ON journeys(user_id);
CREATE INDEX idx_incident_reports_user ON incident_reports(user_id);
CREATE INDEX idx_trusted_contacts_user ON trusted_contacts(user_id);

-- Timestamp indices for range queries
CREATE INDEX idx_alerts_triggered ON alerts(triggered_at);
CREATE INDEX idx_journeys_times ON journeys(started_at, ended_at);
CREATE INDEX idx_incident_reports_time ON incident_reports(incident_time);
