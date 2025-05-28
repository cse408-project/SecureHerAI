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

# Test stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS test
WORKDIR /app
COPY pom.xml .
# Download dependencies with improved DNS and repository settings
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2
COPY . .
# Run tests
CMD ["mvn", "test"]

# Production stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies with improved DNS and repository settings
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2
COPY . .
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine AS production
WORKDIR /app
COPY --from=build /app/target/secureherai-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
