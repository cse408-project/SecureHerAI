package com.secureherai.secureherai_api.util;

import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Utility class for creating test data objects.
 * Provides factory methods for creating various entities with sensible defaults.
 */
public class TestDataUtil {

    public static User createTestUser() {
        return createTestUser("John Doe", "john.doe@example.com", "+1234567890");
    }

    public static User createTestUser(String fullName, String email, String phone) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash("hashedPassword123");
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
        user.setRole(User.Role.USER);
        user.setEmailAlerts(true);
        user.setSmsAlerts(true);
        user.setPushNotifications(true);
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        return user;
    }

    public static User createTestResponder() {
        return createTestResponder("Officer Smith", "officer.smith@police.gov", "+1987654321");
    }

    public static User createTestResponder(String fullName, String email, String phone) {
        User user = createTestUser(fullName, email, phone);
        user.setRole(User.Role.RESPONDER);
        return user;
    }

    public static Responder createTestResponderEntity(UUID userId) {
        Responder responder = new Responder();
        responder.setUserId(userId);
        responder.setResponderType(Responder.ResponderType.POLICE);
        responder.setBadgeNumber("BADGE123");
        responder.setStatus(Responder.Status.AVAILABLE);
        responder.setIsActive(true);
        responder.setLastStatusUpdate(LocalDateTime.now());
        return responder;
    }

    public static User createUnverifiedUser() {
        User user = createTestUser();
        user.setIsVerified(false);
        return user;
    }

    public static User createUserWithResetToken() {
        User user = createTestUser();
        user.setResetToken("reset-token-123");
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        return user;
    }

    public static User createUserWithLoginCode() {
        User user = createTestUser();
        user.setLoginCode("123456");
        user.setLoginCodeExpiry(LocalDateTime.now().plusMinutes(10));
        return user;
    }

    public static User createOAuthUser(String provider) {
        User user = createTestUser();
        user.setOauthProvider(provider);
        return user;
    }

    /**
     * Creates a user with an expired verification token
     */
    public static User createExpiredVerificationUser() {
        User user = createTestUser();
        user.setIsVerified(false);
        return user;
    }

    /**
     * Creates a user with an expired reset token
     */
    public static User createExpiredResetTokenUser() {
        User user = createTestUser();
        user.setResetToken("expired-reset-token");
        user.setResetTokenExpiry(LocalDateTime.now().minusHours(1));
        return user;
    }

    /**
     * Creates a user with an expired login code
     */
    public static User createExpiredLoginCodeUser() {
        User user = createTestUser();
        user.setLoginCode("999999");
        user.setLoginCodeExpiry(LocalDateTime.now().minusMinutes(1));
        return user;
    }

    /**
     * Creates a user with minimal profile (for profile completion tests)
     */
    public static User createMinimalProfileUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Jane Doe");
        user.setEmail("jane.doe@example.com");
        user.setPasswordHash("hashedPassword123");
        user.setRole(User.Role.USER);
        user.setEmailAlerts(true);
        user.setSmsAlerts(true);
        user.setPushNotifications(true);
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        // Missing: phone, dateOfBirth, profilePicture
        return user;
    }
}
