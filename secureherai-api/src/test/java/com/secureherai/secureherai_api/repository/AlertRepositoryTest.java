package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class AlertRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private AlertRepository alertRepository;

    private User testUser;
    private User testUser2;
    private Alert testAlert;
    private static final AtomicInteger counter = new AtomicInteger(0);

    @BeforeEach
    void setUp() {
        // Create test users with unique email and phone
        int uniqueId = counter.incrementAndGet();
        
        testUser = createTestUser(uniqueId);
        testUser = entityManager.persist(testUser);
        
        testUser2 = createTestUser(uniqueId + 1000);
        testUser2 = entityManager.persist(testUser2);
        
        // Create a test alert
        testAlert = new Alert();
        testAlert.setUserId(testUser.getId());
        testAlert.setLatitude(new BigDecimal("40.7128"));
        testAlert.setLongitude(new BigDecimal("-74.0060"));
        testAlert.setAddress("Test address " + uniqueId);
        testAlert.setTriggerMethod("manual");
        testAlert.setAlertMessage("Help needed");
        testAlert.setStatus("active");
        testAlert.setVerificationStatus("pending");
        
        // Not persisting the alert here as different tests will need to persist it differently
    }
    
    private User createTestUser(int uniqueId) {
        User user = new User();
        user.setFullName("Test User " + uniqueId);
        user.setEmail("test.user" + uniqueId + "@example.com");
        user.setPhone("+9876543" + String.format("%03d", uniqueId));
        user.setPasswordHash("hashedPassword");
        user.setRole(User.Role.USER);
        user.setEmailAlerts(true);
        user.setSmsAlerts(true);
        user.setPushNotifications(true);
        user.setIsVerified(true);
        user.setIsAccountNonExpired(true);
        user.setIsAccountNonLocked(true);
        user.setIsCredentialsNonExpired(true);
        user.setIsEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        return user;
    }
    
    private Alert createTestAlertForUser(User user, String status, String verificationStatus, String triggerMethod) {
        int uniqueId = counter.incrementAndGet();
        Alert alert = new Alert();
        alert.setUserId(user.getId());
        alert.setLatitude(new BigDecimal("40.7128"));
        alert.setLongitude(new BigDecimal("-74.0060"));
        alert.setAddress("Test address " + uniqueId);
        alert.setTriggerMethod(triggerMethod);
        alert.setAlertMessage("Help needed " + uniqueId);
        alert.setStatus(status);
        alert.setVerificationStatus(verificationStatus);
        return entityManager.persist(alert);
    }

    @Test
    void findByUserId_ReturnsAlertsForUser() {
        // Arrange
        Alert alert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert alert2 = createTestAlertForUser(testUser, "canceled", "rejected", "voice");
        Alert alert3 = createTestAlertForUser(testUser2, "active", "pending", "automatic");
        entityManager.flush();
        
        // Act
        List<Alert> userAlerts = alertRepository.findByUserId(testUser.getId());
        
        // Assert
        assertEquals(2, userAlerts.size());
        assertTrue(userAlerts.stream().allMatch(alert -> alert.getUserId().equals(testUser.getId())));
    }
    
    @Test
    void findByUserIdAndStatus_ReturnsAlertsWithMatchingUserAndStatus() {
        // Arrange
        Alert activeAlert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert activeAlert2 = createTestAlertForUser(testUser, "active", "verified", "voice");
        Alert canceledAlert = createTestAlertForUser(testUser, "canceled", "verified", "manual");
        Alert activeAlertUser2 = createTestAlertForUser(testUser2, "active", "pending", "automatic");
        entityManager.flush();
        
        // Act
        List<Alert> activeAlerts = alertRepository.findByUserIdAndStatus(testUser.getId(), "active");
        List<Alert> canceledAlerts = alertRepository.findByUserIdAndStatus(testUser.getId(), "canceled");
        List<Alert> resolvedAlerts = alertRepository.findByUserIdAndStatus(testUser.getId(), "resolved");
        
        // Assert
        assertEquals(2, activeAlerts.size());
        assertEquals(1, canceledAlerts.size());
        assertEquals(0, resolvedAlerts.size());
        
        assertTrue(activeAlerts.stream().allMatch(alert -> 
            alert.getUserId().equals(testUser.getId()) && alert.getStatus().equals("active")));
    }
    
    @Test
    void findByIdAndUserId_ReturnsAlertWhenBothMatch() {
        // Arrange
        Alert persistedAlert = entityManager.persist(testAlert);
        entityManager.flush();
        
        // Act
        Optional<Alert> foundAlert = alertRepository.findByIdAndUserId(persistedAlert.getId(), testUser.getId());
        Optional<Alert> notFoundAlert = alertRepository.findByIdAndUserId(persistedAlert.getId(), testUser2.getId());
        
        // Assert
        assertTrue(foundAlert.isPresent());
        assertEquals(testUser.getId(), foundAlert.get().getUserId());
        
        assertFalse(notFoundAlert.isPresent());
    }
    
    @Test
    void findByTriggeredAtBetween_ReturnsAlertsWithinTimeRange() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        
        // Create alerts and manually set triggered times (this is just for testing)
        Alert alert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert alert2 = createTestAlertForUser(testUser, "active", "pending", "voice");
        Alert alert3 = createTestAlertForUser(testUser, "active", "pending", "automatic");
        
        // Note: Since triggeredAt is annotated with @CreationTimestamp, we can't directly set it
        // So we'll use the entityManager to fetch the persisted entities with their actual timestamps
        entityManager.flush();
        entityManager.clear();
        
        // We'll query for a time range that includes all alerts (since they were just created)
        LocalDateTime startTime = now.minusMinutes(5);
        LocalDateTime endTime = now.plusMinutes(5);
        
        // Act
        List<Alert> timeRangeAlerts = alertRepository.findByTriggeredAtBetween(startTime, endTime);
        
        // Assert
        assertEquals(3, timeRangeAlerts.size());
        
        // Also test with a range that should include no alerts
        List<Alert> noAlerts = alertRepository.findByTriggeredAtBetween(
            now.plusMinutes(10), now.plusMinutes(20));
        assertEquals(0, noAlerts.size());
    }
    
    @Test
    void findByStatus_ReturnsAlertsWithMatchingStatus() {
        // Arrange
        Alert activeAlert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert activeAlert2 = createTestAlertForUser(testUser2, "active", "verified", "voice");
        Alert canceledAlert = createTestAlertForUser(testUser, "canceled", "verified", "manual");
        Alert resolvedAlert = createTestAlertForUser(testUser2, "resolved", "verified", "automatic");
        entityManager.flush();
        
        // Act
        List<Alert> activeAlerts = alertRepository.findByStatus("active");
        List<Alert> canceledAlerts = alertRepository.findByStatus("canceled");
        List<Alert> resolvedAlerts = alertRepository.findByStatus("resolved");
        List<Alert> expiredAlerts = alertRepository.findByStatus("expired");
        
        // Assert
        assertEquals(2, activeAlerts.size());
        assertEquals(1, canceledAlerts.size());
        assertEquals(1, resolvedAlerts.size());
        assertEquals(0, expiredAlerts.size());
    }
    
    @Test
    void findByVerificationStatus_ReturnsAlertsWithMatchingVerificationStatus() {
        // Arrange
        Alert pendingAlert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert pendingAlert2 = createTestAlertForUser(testUser2, "active", "pending", "voice");
        Alert verifiedAlert = createTestAlertForUser(testUser, "active", "verified", "manual");
        Alert rejectedAlert = createTestAlertForUser(testUser2, "canceled", "rejected", "automatic");
        entityManager.flush();
        
        // Act
        List<Alert> pendingAlerts = alertRepository.findByVerificationStatus("pending");
        List<Alert> verifiedAlerts = alertRepository.findByVerificationStatus("verified");
        List<Alert> rejectedAlerts = alertRepository.findByVerificationStatus("rejected");
        
        // Assert
        assertEquals(2, pendingAlerts.size());
        assertEquals(1, verifiedAlerts.size());
        assertEquals(1, rejectedAlerts.size());
    }
    
    @Test
    void findRecentAlertsByUser_ReturnsAlertsCreatedAfterGivenDate() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();
        
        Alert alert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert alert2 = createTestAlertForUser(testUser, "canceled", "verified", "voice");
        Alert alert3 = createTestAlertForUser(testUser2, "active", "pending", "automatic");
        entityManager.flush();
        
        // Act - Find alerts triggered in last 24 hours for testUser
        List<Alert> recentAlerts = alertRepository.findRecentAlertsByUser(
            testUser.getId(), now.minusHours(24));
        
        // Assert
        assertEquals(2, recentAlerts.size());
        assertTrue(recentAlerts.stream().allMatch(alert -> alert.getUserId().equals(testUser.getId())));
    }
    
    @Test
    void findActiveAlerts_ReturnsAllActiveAlerts() {
        // Arrange
        Alert activeAlert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert activeAlert2 = createTestAlertForUser(testUser2, "active", "verified", "voice");
        Alert canceledAlert = createTestAlertForUser(testUser, "canceled", "verified", "manual");
        Alert resolvedAlert = createTestAlertForUser(testUser2, "resolved", "verified", "automatic");
        entityManager.flush();
        
        // Act
        List<Alert> activeAlerts = alertRepository.findActiveAlerts();
        
        // Assert
        assertEquals(2, activeAlerts.size());
        assertTrue(activeAlerts.stream().allMatch(alert -> alert.getStatus().equals("active")));
    }
    
    @Test
    void countByUserIdAndStatus_ReturnsCorrectCount() {
        // Arrange
        Alert activeAlert1 = createTestAlertForUser(testUser, "active", "pending", "manual");
        Alert activeAlert2 = createTestAlertForUser(testUser, "active", "verified", "voice");
        Alert canceledAlert = createTestAlertForUser(testUser, "canceled", "verified", "manual");
        Alert activeAlertUser2 = createTestAlertForUser(testUser2, "active", "pending", "automatic");
        entityManager.flush();
        
        // Act
        Long activeAlertsCount = alertRepository.countByUserIdAndStatus(testUser.getId(), "active");
        Long canceledAlertsCount = alertRepository.countByUserIdAndStatus(testUser.getId(), "canceled");
        Long resolvedAlertsCount = alertRepository.countByUserIdAndStatus(testUser.getId(), "resolved");
        Long nonExistentUserCount = alertRepository.countByUserIdAndStatus(UUID.randomUUID(), "active");
        
        // Assert
        assertEquals(2, activeAlertsCount);
        assertEquals(1, canceledAlertsCount);
        assertEquals(0, resolvedAlertsCount);
        assertEquals(0, nonExistentUserCount);
    }
}
