package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class TrustedContactRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TrustedContactRepository trustedContactRepository;

    private User testUser;
    private TrustedContact testContact;
    private static final AtomicInteger counter = new AtomicInteger(0);

    @BeforeEach
    void setUp() {
        // Create a test user with unique email and phone
        int uniqueId = counter.incrementAndGet();
        testUser = new User();
        testUser.setFullName("Test User " + uniqueId);
        testUser.setEmail("test.user" + uniqueId + "@example.com");
        testUser.setPhone("+9876543" + String.format("%03d", uniqueId));
        testUser.setPasswordHash("hashedPassword");
        testUser.setRole(User.Role.USER);
        testUser.setEmailAlerts(true);
        testUser.setSmsAlerts(true);
        testUser.setPushNotifications(true);
        testUser.setIsVerified(true);
        testUser.setIsAccountNonExpired(true);
        testUser.setIsAccountNonLocked(true);
        testUser.setIsCredentialsNonExpired(true);
        testUser.setIsEnabled(true);
        testUser.setCreatedAt(LocalDateTime.now());
        
        // Persist the user first
        testUser = entityManager.persist(testUser);
        
        // Create a trusted contact for the test user
        testContact = new TrustedContact();
        testContact.setUserId(testUser.getId());
        testContact.setName("Emergency Contact " + uniqueId);
        testContact.setRelationship("Family");
        testContact.setPhone("+1234567" + String.format("%03d", uniqueId));
        testContact.setEmail("emergency" + uniqueId + "@example.com");
        testContact.setShareLocation(true);
        
        // Not persisting the contact here as different tests will need to persist it differently
    }

    // @Test
    // void findByUserIdOrderByCreatedAtDesc_ReturnsContactsInOrder() {
    //     // Arrange
    //     // Create multiple contacts with different creation times
    //     TrustedContact contact1 = new TrustedContact();
    //     contact1.setUserId(testUser.getId());
    //     contact1.setName("First Contact");
    //     contact1.setRelationship("Family");
    //     contact1.setPhone("+11111" + counter.get());
    //     contact1.setShareLocation(true);
        
    //     TrustedContact contact2 = new TrustedContact();
    //     contact2.setUserId(testUser.getId());
    //     contact2.setName("Second Contact");
    //     contact2.setRelationship("Friend");
    //     contact2.setPhone("+22222" + counter.get());
    //     contact2.setShareLocation(true);
        
    //     // Persist with specific creation times
    //     contact1.setCreatedAt(LocalDateTime.now().minusDays(1));
    //     contact2.setCreatedAt(LocalDateTime.now());
    //     entityManager.persist(contact1);
    //     entityManager.persist(contact2);
    //     entityManager.flush();
        
    //     // Act
    //     List<TrustedContact> contacts = trustedContactRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        
    //     // Assert
    //     assertEquals(2, contacts.size());
    //     assertEquals("Second Contact", contacts.get(0).getName()); // Most recent should be first
    //     assertEquals("First Contact", contacts.get(1).getName());
    // }
    
    @Test
    void findByUserId_ReturnsAllUserContacts() {
        // Arrange
        // Create and persist test contact
        entityManager.persist(testContact);
        
        // Create another contact for the same user
        TrustedContact secondContact = new TrustedContact();
        secondContact.setUserId(testUser.getId());
        secondContact.setName("Another Contact");
        secondContact.setRelationship("Colleague");
        secondContact.setPhone("+98765" + counter.get());
        secondContact.setShareLocation(false);
        entityManager.persist(secondContact);
        
        // Create a contact for a different user
        User anotherUser = new User();
        anotherUser.setFullName("Another User");
        anotherUser.setEmail("another.user" + counter.get() + "@example.com");
        anotherUser.setPhone("+5555555" + counter.get());
        anotherUser.setPasswordHash("password");
        anotherUser.setRole(User.Role.USER);
        anotherUser.setEmailAlerts(true);
        anotherUser.setSmsAlerts(true);
        anotherUser.setPushNotifications(true);
        anotherUser.setIsVerified(true);
        anotherUser.setIsAccountNonExpired(true);
        anotherUser.setIsAccountNonLocked(true);
        anotherUser.setIsCredentialsNonExpired(true);
        anotherUser.setIsEnabled(true);
        anotherUser = entityManager.persist(anotherUser);
        
        TrustedContact differentUserContact = new TrustedContact();
        differentUserContact.setUserId(anotherUser.getId());
        differentUserContact.setName("Different User Contact");
        differentUserContact.setRelationship("Friend");
        differentUserContact.setPhone("+44444" + counter.get());
        differentUserContact.setShareLocation(true);
        entityManager.persist(differentUserContact);
        
        entityManager.flush();
        
        // Act
        List<TrustedContact> contacts = trustedContactRepository.findByUserId(testUser.getId());
        
        // Assert
        assertEquals(2, contacts.size());
        assertTrue(contacts.stream().allMatch(c -> c.getUserId().equals(testUser.getId())));
    }
    
    @Test
    void findByIdAndUserId_WhenExists_ReturnsContact() {
        // Arrange
        TrustedContact persistedContact = entityManager.persistAndFlush(testContact);
        
        // Act
        Optional<TrustedContact> result = trustedContactRepository.findByIdAndUserId(
                persistedContact.getId(), testUser.getId());
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(testContact.getName(), result.get().getName());
        assertEquals(testContact.getPhone(), result.get().getPhone());
    }
    
    @Test
    void findByIdAndUserId_WhenIdDoesNotMatch_ReturnsEmpty() {
        // Arrange
        entityManager.persistAndFlush(testContact);
        
        // Act
        Optional<TrustedContact> result = trustedContactRepository.findByIdAndUserId(
                UUID.randomUUID(), testUser.getId());
        
        // Assert
        assertFalse(result.isPresent());
    }
    
    @Test
    void findByUserIdAndPhone_WhenExists_ReturnsContact() {
        // Arrange
        TrustedContact persistedContact = entityManager.persistAndFlush(testContact);
        
        // Act
        Optional<TrustedContact> result = trustedContactRepository.findByUserIdAndPhone(
                testUser.getId(), persistedContact.getPhone());
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(testContact.getName(), result.get().getName());
        assertEquals(testContact.getPhone(), result.get().getPhone());
    }
    
    @Test
    void findByUserIdAndPhone_WhenPhoneDoesNotMatch_ReturnsEmpty() {
        // Arrange
        entityManager.persistAndFlush(testContact);
        
        // Act
        Optional<TrustedContact> result = trustedContactRepository.findByUserIdAndPhone(
                testUser.getId(), "+99999" + counter.get());
        
        // Assert
        assertFalse(result.isPresent());
    }
    
    @Test
    void existsByUserIdAndPhone_WhenExists_ReturnsTrue() {
        // Arrange
        TrustedContact persistedContact = entityManager.persistAndFlush(testContact);
        
        // Act
        boolean exists = trustedContactRepository.existsByUserIdAndPhone(
                testUser.getId(), persistedContact.getPhone());
        
        // Assert
        assertTrue(exists);
    }
    
    @Test
    void existsByUserIdAndPhone_WhenDoesNotExist_ReturnsFalse() {
        // Arrange
        entityManager.persistAndFlush(testContact);
        
        // Act
        boolean exists = trustedContactRepository.existsByUserIdAndPhone(
                testUser.getId(), "+99999" + counter.get());
        
        // Assert
        assertFalse(exists);
    }
    
    @Test
    void deleteByIdAndUserId_RemovesContact() {
        // Arrange
        TrustedContact persistedContact = entityManager.persistAndFlush(testContact);
        
        // Act
        trustedContactRepository.deleteByIdAndUserId(persistedContact.getId(), testUser.getId());
        entityManager.flush(); // Ensure the delete operation is executed
        
        // Assert
        Optional<TrustedContact> result = trustedContactRepository.findById(persistedContact.getId());
        assertFalse(result.isPresent());
    }
    
    @Test
    void countByUserId_ReturnsCorrectCount() {
        // Arrange
        // Add multiple contacts
        entityManager.persist(testContact);
        
        TrustedContact secondContact = new TrustedContact();
        secondContact.setUserId(testUser.getId());
        secondContact.setName("Second Contact");
        secondContact.setRelationship("Friend");
        secondContact.setPhone("+33333" + counter.get());
        secondContact.setShareLocation(true);
        entityManager.persist(secondContact);
        
        TrustedContact thirdContact = new TrustedContact();
        thirdContact.setUserId(testUser.getId());
        thirdContact.setName("Third Contact");
        thirdContact.setRelationship("Colleague");
        thirdContact.setPhone("+44444" + counter.get());
        thirdContact.setShareLocation(false);
        entityManager.persist(thirdContact);
        
        entityManager.flush();
        
        // Act
        long count = trustedContactRepository.countByUserId(testUser.getId());
        
        // Assert
        assertEquals(3, count);
    }
}
