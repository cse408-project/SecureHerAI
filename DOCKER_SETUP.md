# SecureHerAI Docker Setup

This project uses Docker and Docker Compose to orchestrate the full-stack application with React Native Expo frontend, Spring Boot API, and PostgreSQL database.

## 🏗️ Architecture

- **Frontend**: React Native Expo (Web) served via Docker
- **Backend**: Spring Boot API with PostgreSQL
- **Database**: PostgreSQL 15
- **CI/CD**: GitHub Actions with EAS Build for Android

## 🚀 Quick Start

### Development Environment

```bash
# Start all services
docker-compose -f docker-compose-dev.yml up --build

# Stop all services
docker-compose -f docker-compose-dev.yml down
```

**Access Points:**
- **Web App**: http://localhost:19006
- **API**: http://localhost:8080
- **Database**: localhost:5432

### Production Environment

```bash
# Build and start production services
docker-compose -f docker-compose-prod.yml up --build -d
```

**Access Points:**
- **Web App**: http://localhost:80
- **API**: http://localhost:8080

## 📁 Project Structure

```
SecureHerAI/
├── secureherai-app/           # React Native Expo Frontend
│   ├── Dockerfile             # Multi-stage build (dev/prod)
│   ├── eas.json              # EAS Build configuration
│   ├── start-expo.sh         # Docker startup script
│   └── nginx.conf            # Production nginx config
├── secureherai-api/          # Spring Boot Backend
├── docker-compose-dev.yml    # Development environment
├── docker-compose-prod.yml   # Production environment
└── .github/workflows/        # CI/CD pipelines
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in appropriate directories:

**secureherai-api/.env** (Development):
```env
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
OAUTH2_CLIENT_ID=your_google_client_id
OAUTH2_CLIENT_SECRET=your_google_client_secret
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

**secureherai-api/.env.production** (Production):
```env
JWT_SECRET=your_production_jwt_secret
MAIL_HOST=your_production_mail_host
AZURE_SPEECH_KEY=your_production_azure_speech_key
AZURE_SPEECH_REGION=your_production_azure_region
# ... other production variables
```

> **Note**: Firebase configuration is not needed for web push notifications. The app uses Firebase Web SDK directly from the frontend with the VAPID key.

### GitHub Secrets

For CI/CD pipeline, configure these secrets in your GitHub repository:

- `EXPO_TOKEN`: Your Expo access token
- `EAS_TOKEN`: Your EAS CLI token

## 🏭 Docker Stages

### Frontend Dockerfile Stages

1. **builder**: Builds Expo web assets (`npm run build:web`)
2. **development**: Development server with hot reload
3. **production**: Nginx serving static files

### Usage Examples

```bash
# Development with hot reload
docker build --target development -t secureherai-web:dev ./secureherai-app

# Production static build
docker build --target production -t secureherai-web:prod ./secureherai-app
```

## 📱 Mobile Development

### Android Builds

Android builds are automated via GitHub Actions using EAS Build:

1. **Preview builds**: Created on pull requests
2. **Production builds**: Created on main branch pushes
3. **Artifacts**: APK/AAB files uploaded to GitHub

### Local Android Development

```bash
# In secureherai-app directory
npm install -g @expo/cli eas-cli

# Login to Expo
expo login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android --profile preview
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 8080, 19006, and 5432 are available
2. **Environment variables**: Check `.env` files exist and are properly formatted
3. **Docker permissions**: Ensure Docker has necessary permissions

### Debugging

```bash
# View logs
docker-compose -f docker-compose-dev.yml logs -f frontend
docker-compose -f docker-compose-dev.yml logs -f api

# Rebuild without cache
docker-compose -f docker-compose-dev.yml build --no-cache

# Access container shell
docker exec -it secureherai_web sh
```

## 🚀 Production Deployment

1. **Build images**: `docker-compose -f docker-compose-prod.yml build`
2. **Set environment variables**: Configure production `.env` files
3. **SSL certificates**: Set up HTTPS with reverse proxy
4. **Monitoring**: Configure logging and health checks
5. **Deploy**: `docker-compose -f docker-compose-prod.yml up -d`

## 📝 Development Workflow

1. **Local development**: Use `docker-compose-dev.yml`
2. **Feature branches**: Create pull requests
3. **CI/CD**: Automated builds and tests via GitHub Actions
4. **Production**: Deploy via `docker-compose-prod.yml`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker Compose
5. Submit a pull request

---

For more information, see the individual README files in each service directory.
