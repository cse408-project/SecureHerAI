# Build stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

# Copy source code and build the application
COPY src ./src
RUN mvn clean package -DskipTests

# Development stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS development
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

COPY . .

EXPOSE 8080
CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.profiles=dev"]

# Production stage
FROM eclipse-temurin:17-jre-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the built jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Create non-root user
RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001 -G spring

USER spring

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

CMD ["java", "-jar", "app.jar"]

