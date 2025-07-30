# SecureHerAI

A comprehensive women's safety platform with AI integration, featuring a robust Spring Boot backend and a modern Expo React Native mobile application.

**Live Web App:** [https://secureherai.expo.app/](https://secureherai.expo.app/)
**Production API:** [https://www.secureherai.me/api](https://www.secureherai.me/api) or [https://secureherai.me/api](https://secureherai.me/api)

---

## 🚀 Features

### Mobile App (Expo React Native)

- **Authentication:** Login, signup, password reset, Google OAuth, profile completion _(Implemented)_
- **SOS & Alerts:** Emergency SOS button, incident reporting, real-time notifications _(Implemented)_
- **Trusted Contacts:** Add, edit, delete, batch manage, emergency call integration _(Implemented)_
- **Notification Preferences:** Email, SMS, push toggles, real-time API sync _(Implemented)_
- **Universal Alert System:** Consistent alerts across web and native, context/provider-based _(Implemented)_
- **Professional UI/UX:** Responsive, accessible, SecureHerAI branding, beautiful modals, error handling _(Implemented)_
- **TypeScript & API Compliance:** Full type safety, matches backend API specs _(Implemented)_
- **AI Chat Helper:** In-app AI-powered chat for guidance and support _(Planned)_
- **Live Map & Route Tracking:** Real-time journey tracking and safe route suggestions _(Planned)_
- **Heatmap & Area Safety:** Visualize area risk and safety intelligence _(Planned)_

### Backend API (Spring Boot)

- **User Management:** Secure registration, login, JWT authentication, Google OAuth _(Implemented)_
- **Trusted Contacts:** CRUD, validation, user isolation, phone/email validation _(Implemented)_
- **Notification System:** Preferences management, alert delivery, status tracking, error handling _(Implemented)_
- **Incident Reporting:** Full-featured reporting with location, time, evidence, privacy controls _(Implemented)_
- **Security:** Role-based access, robust error handling, JWT validation, input validation _(Implemented)_
- **Comprehensive API:** Well-structured REST endpoints, detailed error responses, test coverage _(Implemented)_
- **SOS Alert System (AI-Powered):** Real-time emergency alerting, distress monitoring, auto-generated incident reports _(Partially Implemented, AI features Planned)_
- **Fake Alert Detection (AI-Powered):** AI analyzes audio, video, image, and metadata to verify alert authenticity _(Planned)_
- **Map & Route Tracking:** Live journey tracking, encrypted communication, ETA/status updates, offline support _(Planned)_
- **Heat Map & Safe Routes (AI-Powered):** AI-driven safety intelligence, risk assessment, real-time danger zone alerts _(Planned)_
- **Responder Module:** Emergency responders view/manage/respond to alerts, communicate with users _(Planned)_
- **Admin Module:** System administration, statistics, settings management _(Planned)_
- **AI Chat Helper:** Real-time guidance, safety tips, feature navigation, emotional support _(Planned)_

---

## 🧠 Backend Modules & AI Features

> **Note:** Some modules are fully implemented, while others are in progress or planned for future releases. See tags below.

- **SOS Alert System (AI-Powered):**
  - Real-time emergency alerting, distress monitoring, and auto-generated incident reports _(Partially Implemented, AI features Planned)_
  - Voice command detection for hands-free SOS triggering _(Planned)_
  - Notifies police, responders, and trusted contacts instantly _(Implemented)_
- **Fake Alert Detection (AI-Powered):**
  - AI analyzes audio, video, image, and metadata to verify alert authenticity and reduce false alarms _(Planned)_
- **Map & Route Tracking:**
  - Live journey tracking, encrypted communication, ETA/status updates, and offline support _(Planned)_
- **Heat Map & Safe Routes (AI-Powered):**
  - AI-driven safety intelligence, risk assessment, and real-time danger zone alerts _(Planned)_
  - Suggests safest routes and provides area risk levels _(Planned)_
- **Contacts & Notification:**
  - Trusted contacts management, flexible notification methods (email, SMS, push), and automatic emergency messaging _(Implemented)_
- **Incident Report System:**
  - Submit detailed reports with evidence, privacy controls, and public/private options _(Implemented)_
- **Responder Module:**
  - Enables emergency responders to view, manage, and respond to alerts and communicate with users _(Planned)_
- **Admin Module:**
  - System administration, statistics, and settings management _(Planned)_
- **AI Chat Helper (Optional):**
  - Real-time guidance, safety tips, feature navigation, emotional support, and resource connection via natural language chat _(Planned)_

**All implemented modules are secured with JWT authentication, role-based access, and robust validation.**

---

## 🏗️ Architecture

- **Backend:** Spring Boot 3.x, PostgreSQL, Spring Security, Docker, Azure VM deployment
- **Frontend:** Expo (React Native), Expo Router, EAS (Expo Application Services), NativeWind/Tailwind, TypeScript
- **CI/CD:** GitHub Actions (API deploy to Azure), EAS (web & Android builds/deploys), Namecheap DNS

---

## 📂 Project Structure

```
SecureHerAI/
├── secureherai-api/         # Spring Boot backend
│   ├── src/                 # Java source code
│   ├── database/            # SQL schema
│   ├── endpoints/           # API test files
│   └── ...                  # Docker, docs, etc.
├── secureherai-app/         # Expo mobile app
│   ├── app/                 # App screens (Expo Router)
│   ├── components/          # UI components
│   ├── services/            # API services
│   ├── .eas/                # EAS workflows (CI/CD)
│   └── ...                  # Config, assets, etc.
├── .github/                 # GitHub Actions workflows
├── README.md                # This file
└── ...                      # Docs, design, etc.
```

---

## ⚙️ Setup & Development

### Backend (API)

1. **Prerequisites:** Java 17+, Maven 3.6+, PostgreSQL 12+
2. **Environment:**
   - Copy `.env.example` to `.env` and fill in secrets (see below)
   - Never commit `.env` to version control
3. **Run Locally:**
   ```bash
   docker-compose -f docker-compose-dev.yml up --build
   ```
   API: [http://localhost:8080](http://localhost:8080)

### Mobile App

1. **Install dependencies:**
   ```bash
   cd secureherai-app
   npm install
   ```
2. **Start development server:**
   ```bash
   npx expo start
   ```
   - Web: [http://localhost:8081](http://localhost:8081)
   - Mobile: Scan QR with Expo Go

---

## 🧪 Testing

- **API:** Use HTTP files in `secureherai-api/endpoints/` (e.g., `auth_test.http`, `con_not_test.http`)
- **Mobile:** Use Expo Go, web browser, or emulators.
- **Test Coverage:** All major modules (auth, contacts, notifications, alerts) have comprehensive tests and error handling for implemented features.

---

## 🔒 Security

- JWT authentication and role-based access
- Input validation (phone, email, required fields)
- Proper error codes and messages
- User isolation for sensitive data (contacts, preferences)
- Secure environment variable management

---

## 📲 Deployment & CI/CD

### GitHub Actions (API → Azure)

- **Workflow:** `.github/workflows/deploy.yml`
- **Deploys API** to Azure VM on push to `main`
- **Steps:** Docker build, SSH to VM, deploy with Docker Compose, health checks
- **Secrets:** Managed via GitHub repository secrets (Azure VM, mail, OAuth, etc.)

### EAS (Expo Application Services)

- **Workflows:** `secureherai-app/.eas/workflows/deploy.yml`
- **Builds:** Android APK, deploys web on push to `main`
- **Config:** `secureherai-app/eas.json` for build profiles
- **Web App:** [https://secureherai.expo.app/](https://secureherai.expo.app/)

### Namecheap DNS

- **API Domain:** [https://www.secureherai.me/api](https://www.secureherai.me/api)
- **Web Domain:** [https://secureherai.expo.app/](https://secureherai.expo.app/)

---

## 📖 Documentation

- **Backend:**
  - [Notification System](./NOTIFICATION_SYSTEM_IMPLEMENTATION.md)
  - [Trusted Contacts](./secureherai-api/TRUSTED_CONTACTS_IMPLEMENTATION.md)
  - [Error Response Mapping](./secureherai-api/ERROR_RESPONSE_MAPPING.md)
  - [Token Validation](./secureherai-api/TOKEN_VALIDATION_FIX.md)
  - [API Modules & Endpoints](./secureherai-api/endpoints/docs/README.md)
- **Frontend:**
  - [Contacts & Notifications](./secureherai-app/CONTACTS_NOTIFICATIONS_IMPLEMENTATION.md)
  - [Universal Alert System](./UNIVERSAL_ALERT_IMPLEMENTATION.md)
  - [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
  - [Routing](./secureherai-app/ROUTING_IMPLEMENTATION.md)
  - [OTP Implementation](./secureherai-app/OTP_IMPLEMENTATION.md)
  - [Frontend Update Summary](./secureherai-app/FRONTEND_UPDATE_SUMMARY.md)
- **Design:** See `/Design files/` for architecture diagrams, BPMN, and UI mockups

---

## 🛣️ Roadmap & Future Enhancements

- Real-time notifications (WebSocket) _(Planned)_
- Notification templates and analytics _(Planned)_
- Contact import and verification _(Planned)_
- Location sharing enhancements _(Planned)_
- Emergency templates and cloud sync _(Planned)_
- Rate limiting and advanced security _(Planned)_

---

## 📝 License

MIT License. See [LICENSE](./LICENSE).

---

## 🤝 Contributing

PRs and issues welcome! Please see the documentation and follow the established code style and commit conventions.

---

## 🌐 Links

- **Web App:** [https://secureherai.expo.app/](https://secureherai.expo.app/)
- **API:** [https://www.secureherai.me/api](https://www.secureherai.me/api)
- **GitHub Repository:** [https://github.com/cse408-project/SecureHerAI](https://github.com/cse408-project/SecureHerAI)
- **YouTube Feature Demonstration:** [https://youtu.be/nzQa7lJh-DY](https://youtu.be/nzQa7lJh-DY)
- **YouTube Infrastructure Demonstration:** [https://youtu.be/8jLjqTsxLg8](https://youtu.be/8jLjqTsxLg8)
- **Android APK Download:** [https://drive.google.com/file/d/11Xcj2ziMdfetfb8kgcxy_vzZB5QDoV43/view?usp=sharing](https://drive.google.com/file/d/11Xcj2ziMdfetfb8kgcxy_vzZB5QDoV43/view?usp=sharing)
- **Docs:** See links above and `/Design files/`

---

**Built with ❤️ by the SecureHerAI Team**

---

**References:**

- [SecureHerAI Web App](https://secureherai.expo.app/)
- [API Production Endpoint](https://www.secureherai.me/api)
