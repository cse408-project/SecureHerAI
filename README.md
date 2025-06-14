# SecureHerAI

Women's Safety Application with AI Integration - A comprehensive safety platform with Spring Boot backend and Expo mobile application.

## 🏗️ Project Architecture

This project consists of two main components:

1. **Backend**: Spring Boot REST API (`/src`)
2. **Mobile App**: Expo React Native application (`/secureherai-app`)

## 📱 Mobile Application (Expo)

The mobile application is built with Expo for enhanced development experience and easier deployment.

### Features

- 🔐 User Authentication (Login/Signup)
- 🆘 Emergency SOS Button
- 📝 Incident Reporting
- 📍 Location Services
- 🔔 Real-time Notifications

### Quick Start

```bash
cd secureherai-app
npm install
npx expo start
```

The app will be available at `http://localhost:8081` and accessible via:

- **Web Browser**: Click the web option in the terminal
- **Mobile Device**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal

### Mobile App Documentation

- [Why Expo?](./secureherai-app/WHY_EXPO.md) - Architecture decision rationale
- [Debug Guide](./secureherai-app/DEBUG_GUIDE.md) - Troubleshooting common issues
- [Implementation Summary](./secureherai-app/IMPLEMENTATION_SUMMARY.md) - Technical details

## 🖥️ Backend API (Spring Boot)

### Prerequisites

- Java 17+
- Maven 3.6+
- PostgreSQL 12+

### Environment Configuration

1. **Copy the environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in `.env`:**

   - `MAIL_USERNAME`: Your Gmail address
   - `MAIL_PASSWORD`: Your Gmail App Password (not your regular password)

   To generate Gmail App Password:

   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate an App Password for "Mail"
   - Use that 16-character password in your `.env` file

3. **Never commit the `.env` file to version control** - it contains sensitive credentials

### Running the Backend

```bash
docker-compose -f docker-compose-dev.yml down
export DOCKER_BUILDKIT=1 && docker-compose -f docker-compose-dev.yml up --build
```

The API will be available at `http://localhost:8080`

### API Testing

Use the HTTP files in `endpoints/` directory:

- `auth_test.http` - Authentication endpoints
- `structure_test.http` - Other API endpoints

## 🚀 Full Development Setup

### 1. Start Backend Services

```bash
# Terminal 1: Start database and backend
docker-compose -f docker-compose-dev.yml up --build
```

### 2. Start Mobile App

```bash
# Terminal 2: Start Expo development server
cd secureherai-app
npm install
npx expo start
```

### 3. Access Applications

- **Backend API**: http://localhost:8080
- **Mobile App**: http://localhost:8081 (or scan QR code)

## 📂 Project Structure

```
SecureHerAI/
├── src/                           # Spring Boot backend
│   ├── main/java/                 # Java source code
│   └── main/resources/            # Configuration files
├── secureherai-app/               # Expo mobile application
│   ├── app/                       # App screens (Expo Router)
│   ├── components/                # Reusable UI components
│   ├── services/                  # API services
│   └── config/                    # Configuration
├── docker-compose-dev.yml         # Development environment
├── endpoints/                     # API testing files
└── README.md                      # This file
```

## 🔧 Technology Stack

### Backend

- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL
- **Security**: Spring Security + JWT
- **Email**: JavaMailSender
- **Containerization**: Docker

### Mobile App

- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **UI**: React Native + Expo Vector Icons
- **State Management**: React Hooks
- **HTTP Client**: Fetch API

## 🛠️ Development Workflow

1. **Backend Development**: Make changes to Spring Boot code
2. **Database Migration**: Update schema via Docker Compose
3. **Mobile Development**: Edit Expo app with hot reload
4. **API Integration**: Test endpoints with mobile app
5. **Testing**: Use HTTP files and Expo Go for testing

## 📱 Mobile App Development

### Key Commands

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on specific platform
npx expo start --web        # Web browser
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Build for production
npx expo build

# Update Expo SDK
npx expo install --fix
```

### Important Notes

- The app uses Expo Router for file-based navigation
- Authentication state is managed locally
- API calls are configured in `config/index.ts`
- Icons use `@expo/vector-icons` instead of `react-native-vector-icons`

## 🚨 Troubleshooting

### Backend Issues

- Check Docker containers: `docker ps`
- View logs: `docker-compose logs -f`
- Database connection: Verify PostgreSQL is running

### Mobile App Issues

- Clear Metro cache: `npx expo start --clear`
- Reset dependencies: `rm -rf node_modules && npm install`
- Check [Debug Guide](./secureherai-app/DEBUG_GUIDE.md) for detailed troubleshooting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
