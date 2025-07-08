package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class ResponderRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ResponderRepository responderRepository;

    private User testUser;
    private User testUser2;
    private User testUser3;
    private Responder testResponder;
    private static final AtomicInteger counter = new AtomicInteger(0);

    @BeforeEach
    void setUp() {
        // Create test users with unique email and phone
        int uniqueId = counter.incrementAndGet();
        
        testUser = createTestUser(uniqueId);
        testUser = entityManager.persist(testUser);
        
        testUser2 = createTestUser(uniqueId + 1000);
        testUser2 = entityManager.persist(testUser2);
        
        testUser3 = createTestUser(uniqueId + 2000);
        testUser3 = entityManager.persist(testUser3);
        
        // Create a responder for the test user
        testResponder = new Responder();
        testResponder.setUser(testUser);
        testResponder.setResponderType(Responder.ResponderType.POLICE);
        testResponder.setBadgeNumber("P" + uniqueId);
        testResponder.setStatus(Responder.Status.AVAILABLE);
        testResponder.setCurrentLatitude(new BigDecimal("40.7128"));
        testResponder.setCurrentLongitude(new BigDecimal("-74.0060"));
        testResponder.setIsActive(true);
        
        // Not persisting the responder here as different tests will need to persist it differently
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

    @Test
    void findByUserId_ReturnsResponder_WhenResponderExists() {
        // Arrange
        entityManager.persist(testResponder);
        entityManager.flush();
        
        // Act
        Optional<Responder> foundResponder = responderRepository.findByUserId(testUser.getId());
        
        // Assert
        assertTrue(foundResponder.isPresent());
        assertEquals(testUser.getId(), foundResponder.get().getUserId());
        assertEquals(Responder.ResponderType.POLICE, foundResponder.get().getResponderType());
        assertEquals("P" + counter.get(), foundResponder.get().getBadgeNumber());
    }
    
    @Test
    void findByUserId_ReturnsEmptyOptional_WhenResponderDoesNotExist() {
        // Act
        Optional<Responder> foundResponder = responderRepository.findByUserId(UUID.randomUUID());
        
        // Assert
        assertTrue(foundResponder.isEmpty());
    }
    
    @Test
    void existsByBadgeNumber_ReturnsTrue_WhenBadgeNumberExists() {
        // Arrange
        entityManager.persist(testResponder);
        entityManager.flush();
        
        // Act
        boolean exists = responderRepository.existsByBadgeNumber("P" + counter.get());
        
        // Assert
        assertTrue(exists);
    }
    
    @Test
    void existsByBadgeNumber_ReturnsFalse_WhenBadgeNumberDoesNotExist() {
        // Act
        boolean exists = responderRepository.existsByBadgeNumber("NonExistentBadge");
        
        // Assert
        assertFalse(exists);
    }
    
    @Test
    void findByStatusAndIsActiveTrue_ReturnsActiveResponders_WithGivenStatus() {
        // Arrange
        // Persist first responder (AVAILABLE)
        entityManager.persist(testResponder);
        
        // Create another responder with BUSY status
        Responder busyResponder = new Responder();
        busyResponder.setUser(testUser2);
        busyResponder.setResponderType(Responder.ResponderType.MEDICAL);
        busyResponder.setBadgeNumber("M" + (counter.get() + 1000));
        busyResponder.setStatus(Responder.Status.BUSY);
        busyResponder.setIsActive(true);
        entityManager.persist(busyResponder);
        
        // Create an inactive responder with AVAILABLE status
        Responder inactiveResponder = new Responder();
        inactiveResponder.setUser(testUser3);
        inactiveResponder.setResponderType(Responder.ResponderType.FIRE);
        inactiveResponder.setBadgeNumber("F" + (counter.get() + 2000));
        inactiveResponder.setStatus(Responder.Status.AVAILABLE);
        inactiveResponder.setIsActive(false);
        entityManager.persist(inactiveResponder);
        
        entityManager.flush();
        
        // Act
        List<Responder> availableResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.AVAILABLE);
        List<Responder> busyResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.BUSY);
        List<Responder> offDutyResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.OFF_DUTY);
        
        // Assert
        assertEquals(1, availableResponders.size());
        assertEquals(testUser.getId(), availableResponders.get(0).getUserId());
        
        assertEquals(1, busyResponders.size());
        assertEquals(testUser2.getId(), busyResponders.get(0).getUserId());
        
        assertTrue(offDutyResponders.isEmpty());
    }
    
    @Test
    void findByResponderTypeAndIsActiveTrue_ReturnsActiveResponders_WithGivenType() {
        // Arrange
        // Persist first responder (POLICE)
        entityManager.persist(testResponder);
        
        // Create another responder with MEDICAL type
        Responder medicalResponder = new Responder();
        medicalResponder.setUser(testUser2);
        medicalResponder.setResponderType(Responder.ResponderType.MEDICAL);
        medicalResponder.setBadgeNumber("M" + (counter.get() + 1000));
        medicalResponder.setStatus(Responder.Status.AVAILABLE);
        medicalResponder.setIsActive(true);
        entityManager.persist(medicalResponder);
        
        // Create an inactive responder with POLICE type
        Responder inactiveResponder = new Responder();
        inactiveResponder.setUser(testUser3);
        inactiveResponder.setResponderType(Responder.ResponderType.POLICE);
        inactiveResponder.setBadgeNumber("F" + (counter.get() + 2000));
        inactiveResponder.setStatus(Responder.Status.AVAILABLE);
        inactiveResponder.setIsActive(false);
        entityManager.persist(inactiveResponder);
        
        entityManager.flush();
        
        // Act
        List<Responder> policeResponders = responderRepository.findByResponderTypeAndIsActiveTrue(Responder.ResponderType.POLICE);
        List<Responder> medicalResponders = responderRepository.findByResponderTypeAndIsActiveTrue(Responder.ResponderType.MEDICAL);
        List<Responder> fireResponders = responderRepository.findByResponderTypeAndIsActiveTrue(Responder.ResponderType.FIRE);
        
        // Assert
        assertEquals(1, policeResponders.size());
        assertEquals(testUser.getId(), policeResponders.get(0).getUserId());
        
        assertEquals(1, medicalResponders.size());
        assertEquals(testUser2.getId(), medicalResponders.get(0).getUserId());
        
        assertTrue(fireResponders.isEmpty());
    }
    
    @Test
    void findByStatusAndResponderTypeAndIsActiveTrue_ReturnsActiveResponders_WithGivenStatusAndType() {
        // Arrange
        // Persist first responder (POLICE, AVAILABLE)
        entityManager.persist(testResponder);
        
        // Create another responder with different status (POLICE, BUSY)
        Responder busyPoliceResponder = new Responder();
        busyPoliceResponder.setUser(testUser2);
        busyPoliceResponder.setResponderType(Responder.ResponderType.POLICE);
        busyPoliceResponder.setBadgeNumber("P" + (counter.get() + 1000));
        busyPoliceResponder.setStatus(Responder.Status.BUSY);
        busyPoliceResponder.setIsActive(true);
        entityManager.persist(busyPoliceResponder);
        
        // Create another responder with different type (MEDICAL, AVAILABLE)
        Responder availableMedicalResponder = new Responder();
        availableMedicalResponder.setUser(testUser3);
        availableMedicalResponder.setResponderType(Responder.ResponderType.MEDICAL);
        availableMedicalResponder.setBadgeNumber("M" + (counter.get() + 2000));
        availableMedicalResponder.setStatus(Responder.Status.AVAILABLE);
        availableMedicalResponder.setIsActive(true);
        entityManager.persist(availableMedicalResponder);
        
        entityManager.flush();
        
        // Act
        List<Responder> availablePoliceResponders = responderRepository.findByStatusAndResponderTypeAndIsActiveTrue(
            Responder.Status.AVAILABLE, Responder.ResponderType.POLICE);
        List<Responder> busyPoliceResponders = responderRepository.findByStatusAndResponderTypeAndIsActiveTrue(
            Responder.Status.BUSY, Responder.ResponderType.POLICE);
        List<Responder> availableMedicalResponders = responderRepository.findByStatusAndResponderTypeAndIsActiveTrue(
            Responder.Status.AVAILABLE, Responder.ResponderType.MEDICAL);
            
        // Assert
        assertEquals(1, availablePoliceResponders.size());
        assertEquals(testUser.getId(), availablePoliceResponders.get(0).getUserId());
        
        assertEquals(1, busyPoliceResponders.size());
        assertEquals(testUser2.getId(), busyPoliceResponders.get(0).getUserId());
        
        assertEquals(1, availableMedicalResponders.size());
        assertEquals(testUser3.getId(), availableMedicalResponders.get(0).getUserId());
    }
    
    @Test
    void deleteByUserId_RemovesResponder() {
        // Arrange
        entityManager.persist(testResponder);
        entityManager.flush();
        
        // Verify responder exists
        Optional<Responder> beforeDelete = responderRepository.findByUserId(testUser.getId());
        assertTrue(beforeDelete.isPresent());
        
        // Act
        responderRepository.deleteByUserId(testUser.getId());
        entityManager.flush();
        
        // Assert
        Optional<Responder> afterDelete = responderRepository.findByUserId(testUser.getId());
        assertFalse(afterDelete.isPresent());
    }
}
