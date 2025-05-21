CREATE TABLE users (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    date_of_birth DATE,
    profile_picture TEXT,
    role TEXT NOT NULL DEFAULT 'USER',
    email_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    sms_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    contribution_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (role IN ('USER', 'RESPONDER', 'ADMIN')),
    CHECK (contribution_points >= 0)
);

CREATE TABLE responders (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE trusted_contacts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, phone)
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    trigger_method TEXT NOT NULL,
    alert_message TEXT,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active',
    canceled_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    CHECK (trigger_method IN ('manual', 'voice', 'automatic')),
    CHECK (status IN ('active', 'canceled', 'resolved', 'expired'))
);

CREATE TABLE alert_responders (
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES responders(user_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'accepted',
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (alert_id, responder_id)
);

CREATE TABLE journeys (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_latitude NUMERIC(9,6) NOT NULL,
    start_longitude NUMERIC(9,6) NOT NULL,
    start_address TEXT NOT NULL,
    dest_latitude NUMERIC(9,6) NOT NULL,
    dest_longitude NUMERIC(9,6) NOT NULL,
    dest_address TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_arrival_time TIMESTAMPTZ NOT NULL,
    share_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    ended_at TIMESTAMPTZ,
    CHECK (status IN ('active', 'ended'))
);

CREATE TABLE voice_emotion_analysis (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    transcription TEXT NOT NULL,
    detected_keywords JSONB NOT NULL DEFAULT '[]'::JSONB,
    primary_emotion TEXT NOT NULL,
    confidence NUMERIC(5,4) NOT NULL,
    intensity NUMERIC(5,4) NOT NULL,
    secondary_emotions JSONB NOT NULL DEFAULT '[]'::JSONB,
    sentiment_score NUMERIC(5,4) NOT NULL,
    action TEXT NOT NULL,
    analysis_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (confidence >= 0 AND confidence <= 1),
    CHECK (intensity >= 0 AND intensity <= 1),
    CHECK (sentiment_score >= -1 AND sentiment_score <= 1)
);

CREATE TABLE fake_alert_verifications (
    id UUID PRIMARY KEY,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    verified BOOLEAN,
    confidence NUMERIC(5,4),
    method TEXT,
    analysis_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (event_type IN ('verification', 'misuse')),
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
    CHECK (method IS NULL OR method IN ('voice_recognition', 'location_history', 'ai_analysis')),
    CHECK (alert_id IS NOT NULL OR user_id IS NOT NULL)
);



CREATE TABLE incident_reports (
    id UUID PRIMARY KEY,
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
    UNIQUE (alert_id),
    CHECK (incident_type IN ('harassment', 'theft', 'assault', 'other')),
    CHECK (visibility IN ('public', 'officials_only', 'private')),
    CHECK (status IN ('submitted', 'under_review', 'resolved'))
);

CREATE TABLE report_evidence (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE area_safety_reports (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    safety_rating SMALLINT NOT NULL,
    comment TEXT,
    time_of_day TEXT,
    categories JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (safety_rating >= 1 AND safety_rating <= 5)
);
