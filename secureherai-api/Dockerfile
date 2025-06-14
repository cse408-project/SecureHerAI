# Development stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS development
WORKDIR /app
# Install OpenSSL for certificate fingerprinting
RUN apk add --no-cache openssl

COPY pom.xml .
# Download dependencies with improved DNS and repository settings
RUN mvn dependency:go-offline -Dmaven.repo.remote=https://repo1.maven.org/maven2

COPY . .
# Add the certificate manager script
COPY cert-manager.sh /usr/local/bin/cert-manager.sh
RUN chmod +x /usr/local/bin/cert-manager.sh

EXPOSE 8080
# Use the certificate manager as the entrypoint wrapper
ENTRYPOINT ["/usr/local/bin/cert-manager.sh"]
# Run Spring Boot in dev mode
CMD ["mvn", "spring-boot:run"]

