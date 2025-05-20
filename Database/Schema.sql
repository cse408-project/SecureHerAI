-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- 1. Users & Authentication
CREATE TABLE users (
    id              UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT       NOT NULL,
    email           TEXT       NOT NULL UNIQUE,
    password_hash   TEXT       NOT NULL,
    phone_number    TEXT,
    date_of_birth   DATE,
    profile_picture TEXT,
    role            TEXT       NOT NULL DEFAULT 'user',  -- e.g. user, responder, admin :contentReference[oaicite:9]{index=9}:contentReference[oaicite:10]{index=10}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    token       UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL
);


-- 2. Trusted Contacts & Notification Preferences
CREATE TABLE trusted_contacts (
    id                        UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                   UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                      TEXT       NOT NULL,
    relationship              TEXT,
    phone_number              TEXT,
    email                     TEXT,
    notification_preferences  JSONB,               -- { sms:boolean, email:boolean, push:boolean }
    share_location            BOOLEAN   DEFAULT FALSE,
    invitation_sent           BOOLEAN   DEFAULT FALSE,
    status                    TEXT      DEFAULT 'active',
    created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    user_id                     UUID       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_alerts                BOOLEAN   DEFAULT TRUE,
    sms_alerts                  BOOLEAN   DEFAULT TRUE,
    push_notifications          BOOLEAN   DEFAULT TRUE,
    journey_updates_start       BOOLEAN   DEFAULT TRUE,
    journey_updates_end         BOOLEAN   DEFAULT TRUE,
    journey_updates_deviation   BOOLEAN   DEFAULT TRUE,
    safety_alerts_high_risk_area BOOLEAN  DEFAULT TRUE, -- renamed to match API :contentReference[oaicite:11]{index=11}:contentReference[oaicite:12]{index=12}
    safety_alerts_journey_delay BOOLEAN  DEFAULT TRUE, -- renamed to match API :contentReference[oaicite:13]{index=13}:contentReference[oaicite:14]{index=14}
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);


-- 3. SOS Alert System
CREATE TABLE sos_alerts (
    id                   UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude             NUMERIC(9,6) NOT NULL,
    longitude            NUMERIC(9,6) NOT NULL,
    trigger_method       TEXT       NOT NULL,                -- manual, voice, automatic
    audio_recording      TEXT,
    alert_message        TEXT,
    status               TEXT       DEFAULT 'active',
    verification_status  TEXT       DEFAULT 'pending',       -- tracked for fake-alert module :contentReference[oaicite:15]{index=15}:contentReference[oaicite:16]{index=16}
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Record cancellations via cancel-SOS endpoint :contentReference[oaicite:17]{index=17}:contentReference[oaicite:18]{index=18}
CREATE TABLE sos_alert_cancellations (
    id                SERIAL     PRIMARY KEY,
    sos_alert_id      UUID       NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
    cancelled_at      TIMESTAMPTZ DEFAULT NOW(),
    reason            TEXT,
    additional_info   TEXT
);

-- Notified contacts for each SOS :contentReference[oaicite:19]{index=19}:contentReference[oaicite:20]{index=20}
CREATE TABLE sos_notified_contacts (
    id            SERIAL     PRIMARY KEY,
    sos_alert_id  UUID       NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
    contact_id    UUID       NOT NULL REFERENCES trusted_contacts(id) ON DELETE CASCADE,
    status        TEXT,
    notified_at   TIMESTAMPTZ DEFAULT NOW()
);


-- 4. Fake Alert Detection
CREATE TABLE fake_alert_verifications (
    id                  SERIAL     PRIMARY KEY,
    sos_alert_id        UUID       NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
    verified            BOOLEAN,
    confidence          REAL,
    verification_method TEXT,                  -- voice_recognition, location_history, ai_analysis :contentReference[oaicite:21]{index=21}:contentReference[oaicite:22]{index=22}
    analysis_details    JSONB,
    verified_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE misuse_reports (
    id            UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_alert_id  UUID       NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
    report_reason TEXT,
    description   TEXT,
    evidence      JSONB,
    reported_by   UUID       REFERENCES users(id),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- 5. Journey Tracking & ETA
CREATE TABLE journeys (
    id                  UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_latitude      NUMERIC(9,6) NOT NULL,
    start_longitude     NUMERIC(9,6) NOT NULL,
    start_address       TEXT,
    dest_latitude       NUMERIC(9,6) NOT NULL,
    dest_longitude      NUMERIC(9,6) NOT NULL,
    dest_address        TEXT,
    estimated_arrival   TIMESTAMPTZ,
    sharing_url         TEXT,
    safe_route_polyline TEXT,
    safety_rating       REAL,
    estimated_time      TEXT,
    started_at          TIMESTAMPTZ DEFAULT NOW(),
    ended_at            TIMESTAMPTZ,
    arrived             BOOLEAN   DEFAULT FALSE,
    feedback_rating     SMALLINT,
    feedback_comments   TEXT
);

CREATE TABLE journey_locations (
    id               SERIAL     PRIMARY KEY,
    journey_id       UUID       NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    latitude         NUMERIC(9,6) NOT NULL,
    longitude        NUMERIC(9,6) NOT NULL,
    timestamp        TIMESTAMPTZ DEFAULT NOW(),
    remaining_distance TEXT,
    safety_status    JSONB,
    updated_eta      TIMESTAMPTZ
);

-- ETA endpoint can compute from journeys and journey_locations :contentReference[oaicite:23]{index=23}:contentReference[oaicite:24]{index=24}


-- 6. Heat-Map & Area Safety
CREATE TABLE heatmap_zones (
    id             SERIAL     PRIMARY KEY,
    latitude       NUMERIC(9,6) NOT NULL,
    longitude      NUMERIC(9,6) NOT NULL,
    risk_level     TEXT,
    incident_count INTEGER,
    last_incident  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- User-submitted safety ratings (report-safety) :contentReference[oaicite:25]{index=25}:contentReference[oaicite:26]{index=26}
CREATE TABLE area_safety_reports (
    id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID       REFERENCES users(id) ON DELETE SET NULL,
    latitude       NUMERIC(9,6) NOT NULL,
    longitude      NUMERIC(9,6) NOT NULL,
    safety_rating  SMALLINT   NOT NULL CHECK (safety_rating BETWEEN 1 AND 5),
    comment        TEXT,
    time_of_day    TEXT,
    categories     TEXT[],    -- e.g. ['lighting','isolation']
    created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- 7. Incident Reporting
CREATE TABLE incident_reports (
    id                UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_type     TEXT       NOT NULL,
    description       TEXT,
    latitude          NUMERIC(9,6),
    longitude         NUMERIC(9,6),
    address           TEXT,
    incident_time     TIMESTAMPTZ,
    visibility        TEXT       DEFAULT 'public',
    anonymous         BOOLEAN   DEFAULT FALSE,
    status            TEXT       DEFAULT 'submitted',
    submission_time   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidence (
    id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id   UUID       NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    type        TEXT,                                 -- image, video, etc.
    file_url    TEXT,
    description TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE report_comments (
    id           SERIAL     PRIMARY KEY,
    report_id    UUID       NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    author       TEXT,
    text         TEXT,
    timestamp    TIMESTAMPTZ DEFAULT NOW(),
    is_official  BOOLEAN   DEFAULT FALSE
);

CREATE TABLE report_actions (
    id           SERIAL     PRIMARY KEY,
    report_id    UUID       NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    action_type  TEXT,                                -- status_change, etc.
    from_status  TEXT,
    to_status    TEXT,
    action_by    TEXT,
    timestamp    TIMESTAMPTZ DEFAULT NOW()
);


-- 8. Responders & Assignments
CREATE TABLE responders (
    id                 UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    name               TEXT       NOT NULL,
    responder_type     TEXT,                    -- Police, NGO, etc.
    status             TEXT,                    -- available, busy, off_duty
    location           JSONB,                   -- { latitude, longitude }
    current_assignment UUID       REFERENCES sos_alerts(id)
);

CREATE TABLE responder_alerts (
    id             SERIAL     PRIMARY KEY,
    sos_alert_id   UUID       NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
    responder_id   UUID       NOT NULL REFERENCES responders(id) ON DELETE CASCADE,
    status         TEXT,                                 -- accepted, rejected, in_progress, resolved
    reason         TEXT,                                 -- optional reason on accept/reject :contentReference[oaicite:27]{index=27}:contentReference[oaicite:28]{index=28}
    eta            TEXT,
    assigned_at    TIMESTAMPTZ DEFAULT NOW()
);


-- 9. Analytics: Voice & Emotion
CREATE TABLE voice_command_analyses (
    id                 SERIAL     PRIMARY KEY,
    sos_alert_id       UUID       REFERENCES sos_alerts(id) ON DELETE CASCADE,
    detected_keywords  TEXT[],
    confidence         REAL,
    transcription      TEXT,
    action             TEXT,
    analysis_details   JSONB,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);  -- for api/sos/voice-analysis :contentReference[oaicite:29]{index=29}:contentReference[oaicite:30]{index=30}

CREATE TABLE emotion_analyses (
    id                  SERIAL     PRIMARY KEY,
    sos_alert_id        UUID       REFERENCES sos_alerts(id) ON DELETE CASCADE,
    primary_emotion     TEXT,
    confidence          REAL,
    intensity           REAL,
    secondary_emotions  TEXT[],
    sentiment_score     REAL,
    recommended_action  TEXT,
    analysis_details    JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);  -- for api/sos/emotion-analysis :contentReference[oaicite:31]{index=31}:contentReference[oaicite:32]{index=32}


-- 10. Admin Settings
CREATE TABLE admin_settings (
    key        TEXT       PRIMARY KEY,
    value      JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

