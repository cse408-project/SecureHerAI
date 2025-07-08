package com.secureherai.secureherai_api.service;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private final String testSecret = "testsecretkeythatislongenoughforhmacsha256algorithm";
    private final long testExpiration = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey", testSecret);
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", testExpiration);
    }

    @Test
    void generateToken_WithValidParameters_ReturnsValidToken() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "USER";

        // Act
        String token = jwtService.generateToken(userId, email, role);

        // Assert
        assertNotNull(token);
        assertTrue(token.length() > 0);
        assertEquals(userId, jwtService.extractUserId(token));
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(role, jwtService.extractRole(token));
    }

    @Test
    void generateTokenWithProfileStatus_WithValidParameters_ReturnsValidToken() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "USER";
        boolean isProfileComplete = true;

        // Act
        String token = jwtService.generateTokenWithProfileStatus(userId, email, role, isProfileComplete);

        // Assert
        assertNotNull(token);
        assertTrue(token.length() > 0);
        assertEquals(userId, jwtService.extractUserId(token));
        assertEquals(email, jwtService.extractEmail(token));
        assertEquals(role, jwtService.extractRole(token));
        
        // Check profile status claim
        var claims = jwtService.extractAllClaims(token);
        assertEquals(isProfileComplete, claims.get("profileComplete", Boolean.class));
    }

    @Test
    void generateTokenWithClaims_WithAdditionalClaims_IncludesAllClaims() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "USER";
        boolean isProfileComplete = false;
        Map<String, Object> additionalClaims = new HashMap<>();
        additionalClaims.put("customClaim", "customValue");
        additionalClaims.put("numericClaim", 123);

        // Act
        String token = jwtService.generateTokenWithClaims(userId, email, role, isProfileComplete, additionalClaims);

        // Assert
        var claims = jwtService.extractAllClaims(token);
        assertEquals("customValue", claims.get("customClaim", String.class));
        assertEquals(123, claims.get("numericClaim", Integer.class));
        assertEquals(isProfileComplete, claims.get("profileComplete", Boolean.class));
    }

    @Test
    void extractUserId_WithValidToken_ReturnsCorrectUserId() {
        // Arrange
        UUID expectedUserId = UUID.randomUUID();
        String token = jwtService.generateToken(expectedUserId, "test@example.com", "USER");

        // Act
        UUID actualUserId = jwtService.extractUserId(token);

        // Assert
        assertEquals(expectedUserId, actualUserId);
    }

    @Test
    void extractEmail_WithValidToken_ReturnsCorrectEmail() {
        // Arrange
        String expectedEmail = "test@example.com";
        String token = jwtService.generateToken(UUID.randomUUID(), expectedEmail, "USER");

        // Act
        String actualEmail = jwtService.extractEmail(token);

        // Assert
        assertEquals(expectedEmail, actualEmail);
    }

    @Test
    void extractRole_WithValidToken_ReturnsCorrectRole() {
        // Arrange
        String expectedRole = "ADMIN";
        String token = jwtService.generateToken(UUID.randomUUID(), "test@example.com", expectedRole);

        // Act
        String actualRole = jwtService.extractRole(token);

        // Assert
        assertEquals(expectedRole, actualRole);
    }

    @Test
    void extractSubject_WithValidToken_ReturnsCorrectSubject() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String token = jwtService.generateToken(userId, "test@example.com", "USER");

        // Act
        String subject = jwtService.extractSubject(token);

        // Assert
        assertEquals(userId.toString(), subject);
    }

    @Test
    void isTokenValid_WithValidToken_ReturnsTrue() {
        // Arrange
        String token = jwtService.generateToken(UUID.randomUUID(), "test@example.com", "USER");

        // Act
        boolean isValid = jwtService.isTokenValid(token);

        // Assert
        assertTrue(isValid);
    }

    @Test
    void isTokenValid_WithExpiredToken_ReturnsFalse() {
        // Arrange - Create service with very short expiration
        JwtService shortExpiryService = new JwtService();
        ReflectionTestUtils.setField(shortExpiryService, "secretKey", testSecret);
        ReflectionTestUtils.setField(shortExpiryService, "jwtExpiration", 1L); // 1ms
        
        String token = shortExpiryService.generateToken(UUID.randomUUID(), "test@example.com", "USER");
        
        // Wait for token to expire
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Act
        boolean isValid = jwtService.isTokenValid(token);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void isTokenValid_WithInvalidToken_ReturnsFalse() {
        // Arrange
        String invalidToken = "invalid.jwt.token";

        // Act
        boolean isValid = jwtService.isTokenValid(invalidToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void isTokenValid_WithMalformedToken_ReturnsFalse() {
        // Arrange
        String malformedToken = "this.is.not.a.valid.jwt";

        // Act
        boolean isValid = jwtService.isTokenValid(malformedToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void isTokenValid_WithTamperedToken_ReturnsFalse() {
        // Arrange
        String originalToken = jwtService.generateToken(UUID.randomUUID(), "test@example.com", "USER");
        String tamperedToken = originalToken.substring(0, originalToken.length() - 5) + "AAAAA";

        // Act
        boolean isValid = jwtService.isTokenValid(tamperedToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void extractAllClaims_WithValidToken_ReturnsAllClaims() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateToken(userId, email, role);

        // Act
        var claims = jwtService.extractAllClaims(token);

        // Assert
        assertNotNull(claims);
        assertEquals(userId.toString(), claims.getSubject());
        assertEquals(email, claims.get("email", String.class));
        assertEquals(role, claims.get("role", String.class));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void extractAllClaims_WithInvalidToken_ThrowsException() {
        // Arrange
        String invalidToken = "invalid.jwt.token";

        // Act & Assert
        assertThrows(Exception.class, () -> jwtService.extractAllClaims(invalidToken));
    }

    @Test
    void tokenExpiration_IsSetCorrectly() {
        // Arrange
        String token = jwtService.generateToken(UUID.randomUUID(), "test@example.com", "USER");
        var claims = jwtService.extractAllClaims(token);

        // Act
        long actualExpiration = claims.getExpiration().getTime() - claims.getIssuedAt().getTime();

        // Assert
        assertEquals(testExpiration, actualExpiration);
    }
}
