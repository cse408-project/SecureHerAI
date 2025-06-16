# Development stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS development
WORKDIR /app

COPY pom.xml .
# Download dependencies with improved DNS and repository settings
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

COPY . .

EXPOSE 8080
# Run Spring Boot in dev mode
CMD ["mvn", "spring-boot:run"]

