# <div align="center">SecureHerAI API Documentation</div>

### <div align="center"> Women's Safety Application </div>

<div align="center">1. 2005009 - Ahmed Nur Swapnil </div>
<div align="center">2. 2005022 - Ekramul Haque Amin </div>
<div align="center">3. 2005025 - Sonia Khatun </div>

---

## Index

- [API Status Codes](#api-status-codes)
- [Core Features](#core-features)
- [Optional Features](#optional-features)
- [Modules](#modules)
  - [User Authentication Module](./auth-module.md)
  - [SOS Alert System Module](./sos-module.md)
  - [Fake Alert Detection Module](./fake-alert-module.md)
  - [Map & Route Tracking Module](./route-tracking-module.md)
  - [Heat Map Module](./heatmap-module.md)
  - [Contacts & Notification Module](./contacts-module.md)
  - [Incident Report Module](./incident-report-module.md)
  - [Responder Module](./responder-module.md)
  - [Admin Module](./admin-module.md)
  - [AI Chat Helper Module](./ai-chat-module.md)

## API Status Codes

| Status Code | Description                                      |
| ----------- | ------------------------------------------------ |
| 200         | Success                                          |
| 201         | Created                                          |
| 400         | Bad Request - Invalid input parameters           |
| 401         | Unauthorized - Invalid or missing authentication |
| 403         | Forbidden - Insufficient permissions             |
| 404         | Not Found - Resource doesn't exist               |
| 409         | Conflict - Resource already exists               |
| 422         | Unprocessable Entity - Validation error          |
| 429         | Too Many Requests - Rate limit exceeded          |
| 500         | Internal Server Error                            |

## Core Features

1. **SOS Alert System (AI-Powered)**

   - AI-driven emergency alert system
   - Real-time distress monitoring
   - Automatic alerts with location and timestamps
   - Notifications to police and trusted contacts
   - AI-generated preliminary incident reports
   - Manual one-tap emergency button

2. **Fake Alert Detection (AI-Powered)**

   - AI-based verification of alert authenticity
   - Audio/video/image/location/metadata analysis
   - Flagging and reviewing of suspicious alerts
   - Basic metadata verification

3. **Map Route Tracking & Communication**

   - Live tracking of victim and responder locations
   - Encrypted communication channel
   - Estimated arrival times and status updates
   - Offline capabilities with cached locations
   - Embedded panic button

4. **Heat Map (AI-Powered)**
   - AI-based safety intelligence
   - Historical incident analysis
   - Color-coded risk indicators
   - Safe route suggestions
   - Real-time danger zone alerts
   - Customizable risk thresholds

## Optional Features

1. **Contacts & Notification**

   - Trusted contacts management
   - Flexible notification methods
   - Automatic emergency messaging
   - Alert validation assistance

2. **Report System**

   - Incident reporting with evidence
   - Public/private visibility options
   - Connected incident tracking

3. **AI Chat Helper (AI/Optional)**
   - Real-time guidance and support
   - Safety tips and procedures
   - Feature navigation assistance
   - Emotional support and resource connection

## Modules

Each module contains specific endpoints and functionality:

- **[User Authentication Module](./auth-module.md)** - Login, registration, profile management, OAuth
- **[SOS Alert System Module](./sos-module.md)** - Emergency alerts, voice commands, alert management
- **[Fake Alert Detection Module](./fake-alert-module.md)** - Alert verification and authenticity checking
- **[Map & Route Tracking Module](./route-tracking-module.md)** - Journey tracking, location updates, ETA calculations
- **[Heat Map Module](./heatmap-module.md)** - Safety intelligence, risk assessment, safe routes
- **[Contacts & Notification Module](./contacts-module.md)** - Trusted contacts, notification preferences
- **[Incident Report Module](./incident-report-module.md)** - Report submission, evidence upload, visibility management
- **[Responder Module](./responder-module.md)** - Alert response, user communication, status updates
- **[Admin Module](./admin-module.md)** - System administration, statistics, settings management
- **[AI Chat Helper Module](./ai-chat-module.md)** - AI-powered assistance and guidance
