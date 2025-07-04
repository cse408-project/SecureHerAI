# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Development stage
FROM maven:3.9.6-eclipse-temurin-17 AS development
WORKDIR /app

# Install required native libraries for Azure Speech SDK
RUN apt-get update && apt-get install -y \
    libasound2-dev \
    libssl-dev \
    libc6-dev \
    libffi-dev \
    libgstreamer1.0-dev \
    libgstreamer-plugins-base1.0-dev \
    uuid-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pom.xml .
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

COPY . .

EXPOSE 8080
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.profiles=dev"]

# Production stage
FROM eclipse-temurin:17-jre AS production
WORKDIR /app

# Install required native libraries for Azure Speech SDK and curl for health checks
RUN apt-get update && apt-get install -y \
    libasound2 \
    libssl3 \
    libc6 \
    libffi8 \
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    libuuid1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN groupadd -g 1001 spring && \
    useradd -u 1001 -g spring -s /bin/false spring && \
    chown -R spring:spring /app

USER spring

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

CMD ["java", "-jar", "app.jar"]

