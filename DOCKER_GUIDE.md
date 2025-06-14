# 🐳 Docker Guide for SecureHer AI

## 📋 Overview

SecureHer AI uses Docker for containerized development and deployment. This guide covers all Docker-related operations for debugging, development, and production.

---

## 🗂️ Docker Files Structure

```
SecureHerAI/
├── docker-compose-dev.yml     # Development environment
├── secureherai-api/
│   └── Dockerfile             # Multi-stage API container
└── .env                       # Environment variables (create if missing)
```

---

## 🚀 Quick Start Commands

### **1. Start Development Environment**

```bash
# Navigate to project root
cd "/mnt/AN_Swapnil_D/Term Files/l4-t1/CSE408/SecureHerAI"

# Start all services (API + Database)
docker-compose -f docker-compose-dev.yml up -d

# View logs
docker-compose -f docker-compose-dev.yml logs -f

# Stop all services
docker-compose -f docker-compose-dev.yml down
```

### **2. Individual Service Management**

```bash
# Start only database
docker-compose -f docker-compose-dev.yml up db -d

# Start only API (requires database)
docker-compose -f docker-compose-dev.yml up api -d

# Restart specific service
docker-compose -f docker-compose-dev.yml restart api
```

---

## 🔧 Development Debugging

### **1. Check Service Status**

```bash
# Check running containers
docker ps

# Check all containers (including stopped)
docker ps -a

# Check service health
docker-compose -f docker-compose-dev.yml ps
```

### **2. View Service Logs**

```bash
# API logs
docker-compose -f docker-compose-dev.yml logs api

# Database logs
docker-compose -f docker-compose-dev.yml logs db

# Follow logs in real-time
docker-compose -f docker-compose-dev.yml logs -f api

# Last 100 lines of logs
docker-compose -f docker-compose-dev.yml logs --tail=100 api
```

### **3. Access Running Containers**

```bash
# Execute commands in API container
docker-compose -f docker-compose-dev.yml exec api bash

# Access PostgreSQL database
docker-compose -f docker-compose-dev.yml exec db psql -U user -d secureherai

# Run Maven commands in API container
docker-compose -f docker-compose-dev.yml exec api mvn test
docker-compose -f docker-compose-dev.yml exec api mvn clean compile
```

---

## 🐛 Common Debugging Scenarios

### **1. API Won't Start**

```bash
# Check API container logs
docker-compose -f docker-compose-dev.yml logs api

# Common issues and solutions:
# - Database not ready: Wait for health check
# - Port conflicts: Check if port 8080 is in use
# - Maven dependencies: Rebuild container

# Force rebuild API container
docker-compose -f docker-compose-dev.yml build --no-cache api
docker-compose -f docker-compose-dev.yml up api
```

### **2. Database Connection Issues**

```bash
# Check database health
docker-compose -f docker-compose-dev.yml exec db pg_isready -U user -d secureherai

# Connect to database manually
docker-compose -f docker-compose-dev.yml exec db psql -U user -d secureherai

# Check database logs
docker-compose -f docker-compose-dev.yml logs db

# Reset database (WARNING: This deletes all data)
docker-compose -f docker-compose-dev.yml down -v
docker-compose -f docker-compose-dev.yml up db -d
```

### **3. Network Issues**

```bash
# Check Docker network
docker network ls
docker network inspect secureherai_app-network

# Test API connectivity from frontend
curl http://localhost:8080/api/health

# Test from inside network
docker-compose -f docker-compose-dev.yml exec api curl http://db:5432
```

---

## 📊 Environment Configuration

### **Create .env File**

```bash
# Create environment file
cat > .env << 'EOF'
# Database Configuration
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=secureherai

# Email Configuration (Optional for development)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# JWT Configuration
JWT_SECRET=HRVu1xFYfraq/lculzNaXzMHVady85sMReuLwlSzEjcKznYOEPdbbK3F+9hq+4muGxhYfft5nNQYxbDZIGzzAA==
JWT_EXPIRATION=86400000
EOF
```

### **Development vs Production**

```yaml
# docker-compose-dev.yml (Current setup)
environment:
  SPRING_PROFILES_ACTIVE: dev
  SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/secureherai

# For production, create docker-compose-prod.yml
environment:
  SPRING_PROFILES_ACTIVE: prod
  SPRING_DATASOURCE_URL: jdbc:postgresql://your-prod-db:5432/secureherai
```

---

## 🛠️ Docker Commands Reference

### **Container Management**

```bash
# Build specific service
docker-compose -f docker-compose-dev.yml build api

# Rebuild without cache
docker-compose -f docker-compose-dev.yml build --no-cache api

# Start services in foreground (see logs directly)
docker-compose -f docker-compose-dev.yml up

# Start in background
docker-compose -f docker-compose-dev.yml up -d

# Stop and remove containers
docker-compose -f docker-compose-dev.yml down

# Stop, remove containers, and delete volumes
docker-compose -f docker-compose-dev.yml down -v
```

### **Development Workflow**

```bash
# 1. Start development environment
docker-compose -f docker-compose-dev.yml up -d

# 2. Watch API logs while developing
docker-compose -f docker-compose-dev.yml logs -f api

# 3. Make code changes (hot reload enabled)
# Changes in ./secureherai-api are automatically synced

# 4. Restart API if needed
docker-compose -f docker-compose-dev.yml restart api

# 5. Run tests
docker-compose -f docker-compose-dev.yml exec api mvn test

# 6. Stop when done
docker-compose -f docker-compose-dev.yml down
```

---

## 🏗️ Dockerfile Stages Explained

### **Multi-Stage Build Process**

```dockerfile
# Stage 1: Development
FROM maven:3.9.6-eclipse-temurin-17-alpine AS development
# - Hot reload enabled
# - Volume mounting for code changes
# - Development dependencies included

# Stage 2: Test
FROM maven:3.9.6-eclipse-temurin-17-alpine AS test
# - Runs test suite
# - Useful for CI/CD pipelines

# Stage 3: Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
# - Compiles production JAR
# - Excludes test files

# Stage 4: Production
FROM eclipse-temurin:17-jre-alpine AS production
# - Minimal runtime image
# - Only includes compiled JAR
# - Optimized for production deployment
```

### **Build Specific Stages**

```bash
# Build for development (default)
docker build -t secureherai-api:dev ./secureherai-api

# Build for testing
docker build -t secureherai-api:test --target test ./secureherai-api

# Build for production
docker build -t secureherai-api:prod --target production ./secureherai-api
```

---

## 📱 Frontend Integration

### **API Base URL Configuration**

```typescript
// In secureherai-app/config/index.ts
export const API_BASE_URL = __DEV__
  ? "http://10.0.2.2:8080/api" // Android emulator
  : "http://localhost:8080/api"; // iOS simulator/browser

// For physical device testing
export const API_BASE_URL = "http://YOUR_LOCAL_IP:8080/api";
// Find your IP: ip addr show or ifconfig
```

### **Test API Connection**

```bash
# From host machine
curl http://localhost:8080/api/health

# Get your local IP for mobile testing
hostname -I
# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

---

## 🔍 Monitoring & Health Checks

### **Health Check Endpoints**

```bash
# API health check
curl http://localhost:8080/api/health

# Database health check
docker-compose -f docker-compose-dev.yml exec db pg_isready -U user -d secureherai

# Container health status
docker-compose -f docker-compose-dev.yml ps
```

### **Performance Monitoring**

```bash
# Container resource usage
docker stats

# Specific container stats
docker stats secureherai_api postgres_secureherai

# Disk usage
docker system df

# Clean up unused resources
docker system prune -f
```

---

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **1. Port Already in Use**

```bash
# Check what's using port 8080
sudo lsof -i :8080
sudo netstat -tulpn | grep :8080

# Kill process if needed
sudo kill -9 <PID>

# Or change port in docker-compose-dev.yml
ports:
  - "8081:8080"  # Map to different host port
```

#### **2. Permission Denied**

```bash
# Fix Docker permissions
sudo chmod 666 /var/run/docker.sock

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### **3. Database Data Corruption**

```bash
# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose-dev.yml down -v
docker volume rm secureherai_postgres_data
docker-compose -f docker-compose-dev.yml up db -d
```

#### **4. API Won't Connect to Database**

```bash
# Check network connectivity
docker-compose -f docker-compose-dev.yml exec api ping db

# Verify database is ready
docker-compose -f docker-compose-dev.yml logs db | grep "ready to accept connections"

# Check environment variables
docker-compose -f docker-compose-dev.yml exec api env | grep SPRING_DATASOURCE
```

---

## 🚀 Production Deployment

### **Build Production Images**

```bash
# Build production API
docker build -t secureherai-api:latest --target production ./secureherai-api

# Run production container
docker run -d \
  --name secureherai-api-prod \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://your-db:5432/secureherai \
  secureherai-api:latest
```

### **Production Docker Compose**

```yaml
# Create docker-compose-prod.yml
version: "3.8"
services:
  api:
    build:
      context: ./secureherai-api
      target: production
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://your-prod-db:5432/secureherai
    restart: unless-stopped
```

---

## 📝 Quick Reference Commands

```bash
# Start everything
docker-compose -f docker-compose-dev.yml up -d

# View all logs
docker-compose -f docker-compose-dev.yml logs -f

# Restart API
docker-compose -f docker-compose-dev.yml restart api

# Access API container
docker-compose -f docker-compose-dev.yml exec api bash

# Connect to database
docker-compose -f docker-compose-dev.yml exec db psql -U user -d secureherai

# Clean restart
docker-compose -f docker-compose-dev.yml down && docker-compose -f docker-compose-dev.yml up -d

# Nuclear option (reset everything)
docker-compose -f docker-compose-dev.yml down -v --remove-orphans
docker system prune -f
```

---

**🎯 Your SecureHer AI development environment is now containerized and ready for debugging!**
