package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Rollback;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private static int userCounter = 0;
    private static final java.util.concurrent.atomic.AtomicInteger counter = new java.util.concurrent.atomic.AtomicInteger(0);

    @BeforeEach
    void setUp() {
        // Create a user with unique email and phone for each test
        userCounter++;
        testUser = new User();
        testUser.setFullName("John Doe " + userCounter);
        testUser.setEmail("john.doe" + userCounter + "@example.com");
        testUser.setPhone("+123456" + String.format("%04d", userCounter));
        testUser.setPasswordHash("hashedPassword");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setRole(User.Role.USER);
        testUser.setEmailAlerts(true);
        testUser.setSmsAlerts(true);
        testUser.setPushNotifications(true);
        testUser.setIsVerified(true);
        // Set all required UserDetails boolean fields
        testUser.setIsAccountNonExpired(true);
        testUser.setIsAccountNonLocked(true);
        testUser.setIsCredentialsNonExpired(true);
        testUser.setIsEnabled(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void findByEmail_WhenUserExists_ReturnsUser() {
        // Arrange
        User savedUser = entityManager.persistAndFlush(testUser);
        String email = savedUser.getEmail();  // Get the actual email saved in DB

        // Act
        Optional<User> result = userRepository.findByEmail(email);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(email, result.get().getEmail());
        assertEquals(testUser.getFullName(), result.get().getFullName());
    }

    @Test
    void findByEmail_WhenUserDoesNotExist_ReturnsEmpty() {
        // Act
        Optional<User> result = userRepository.findByEmail("nonexistent@example.com");

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    void findByPhone_WhenUserExists_ReturnsUser() {
        // Arrange
        User savedUser = entityManager.persistAndFlush(testUser);
        String phone = savedUser.getPhone();  // Get the actual phone saved in DB

        // Act
        Optional<User> result = userRepository.findByPhone(phone);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(phone, result.get().getPhone());
        assertEquals(testUser.getFullName(), result.get().getFullName());
    }

    @Test
    void findByPhone_WhenUserDoesNotExist_ReturnsEmpty() {
        // Act
        Optional<User> result = userRepository.findByPhone("+9999999999");

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    void existsByEmail_WhenUserExists_ReturnsTrue() {
        // Arrange
        User savedUser = entityManager.persistAndFlush(testUser);
        String email = savedUser.getEmail(); // Get the actual email saved in DB

        // Act
        boolean exists = userRepository.existsByEmail(email);

        // Assert
        assertTrue(exists);
    }

    @Test
    void existsByEmail_WhenUserDoesNotExist_ReturnsFalse() {
        // Act
        boolean exists = userRepository.existsByEmail("nonexistent@example.com");

        // Assert
        assertFalse(exists);
    }

    @Test
    void existsByPhone_WhenUserExists_ReturnsTrue() {
        // Arrange
        User savedUser = entityManager.persistAndFlush(testUser);
        String phone = savedUser.getPhone(); // Get the actual phone saved in DB

        // Act
        boolean exists = userRepository.existsByPhone(phone);

        // Assert
        assertTrue(exists);
    }

    @Test
    void existsByPhone_WhenUserDoesNotExist_ReturnsFalse() {
        // Act
        boolean exists = userRepository.existsByPhone("+9999999999");

        // Assert
        assertFalse(exists);
    }

    @Test
    void findByResetToken_WhenTokenExists_ReturnsUser() {
        // Arrange
        String resetToken = "reset-token-123";
        testUser.setResetToken(resetToken);
        testUser.setResetTokenExpiry(LocalDateTime.now().plusHours(1));
        entityManager.persistAndFlush(testUser);

        // Act
        Optional<User> result = userRepository.findByResetToken(resetToken);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(resetToken, result.get().getResetToken());
    }

    @Test
    void findByResetToken_WhenTokenDoesNotExist_ReturnsEmpty() {
        // Act
        Optional<User> result = userRepository.findByResetToken("nonexistent-token");

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    void findByLoginCode_WhenCodeExists_ReturnsUser() {
        // Arrange
        String loginCode = "123456";
        testUser.setLoginCode(loginCode);
        testUser.setLoginCodeExpiry(LocalDateTime.now().plusMinutes(10));
        entityManager.persistAndFlush(testUser);

        // Act
        Optional<User> result = userRepository.findByLoginCode(loginCode);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(loginCode, result.get().getLoginCode());
    }

    @Test
    void findByLoginCode_WhenCodeDoesNotExist_ReturnsEmpty() {
        // Act
        Optional<User> result = userRepository.findByLoginCode("999999");

        // Assert
        assertFalse(result.isPresent());
    }

    @Test
    void save_WithValidUser_PersistsUser() {
        // Act
        User savedUser = userRepository.save(testUser);

        // Assert
        assertNotNull(savedUser.getId());
        assertEquals(testUser.getEmail(), savedUser.getEmail());
        assertEquals(testUser.getFullName(), savedUser.getFullName());
        assertEquals(testUser.getRole(), savedUser.getRole());
        
        // Verify it's actually in the database
        Optional<User> foundUser = userRepository.findById(savedUser.getId());
        assertTrue(foundUser.isPresent());
    }

    @Test
    @Transactional
    void deleteByIsVerifiedFalseAndCreatedAtBefore_RemovesUnverifiedOldUsers() {
        // Arrange
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(1);
        
        // Use unique emails and phone numbers for this test
        String oldEmail = "old_deletion_test" + counter.incrementAndGet() + "@example.com";
        String oldPhone = "+1111111" + counter.incrementAndGet();
        String newEmail = "new_deletion_test" + counter.incrementAndGet() + "@example.com";
        String newPhone = "+2222222" + counter.incrementAndGet();
        
        User unverifiedOldUser = new User();
        unverifiedOldUser.setFullName("Old User");
        unverifiedOldUser.setEmail(oldEmail);
        unverifiedOldUser.setPhone(oldPhone);
        unverifiedOldUser.setPasswordHash("hashedPassword");
        unverifiedOldUser.setRole(User.Role.USER);
        unverifiedOldUser.setIsVerified(false);
        // Set all required boolean fields
        unverifiedOldUser.setEmailAlerts(true);
        unverifiedOldUser.setSmsAlerts(true);
        unverifiedOldUser.setPushNotifications(true);
        unverifiedOldUser.setIsAccountNonExpired(true);
        unverifiedOldUser.setIsAccountNonLocked(true);
        unverifiedOldUser.setIsCredentialsNonExpired(true);
        unverifiedOldUser.setIsEnabled(true);
        
        User unverifiedNewUser = new User();
        unverifiedNewUser.setFullName("New User");
        unverifiedNewUser.setEmail(newEmail);
        unverifiedNewUser.setPhone(newPhone);
        unverifiedNewUser.setPasswordHash("hashedPassword");
        unverifiedNewUser.setRole(User.Role.USER);
        unverifiedNewUser.setIsVerified(false);
        // Set all required boolean fields
        unverifiedNewUser.setEmailAlerts(true);
        unverifiedNewUser.setSmsAlerts(true);
        unverifiedNewUser.setPushNotifications(true);
        unverifiedNewUser.setIsAccountNonExpired(true);
        unverifiedNewUser.setIsAccountNonLocked(true);
        unverifiedNewUser.setIsCredentialsNonExpired(true);
        unverifiedNewUser.setIsEnabled(true);
        
        // Save entities first to get IDs
        User savedOldUser = entityManager.persistAndFlush(unverifiedOldUser);
        User savedNewUser = entityManager.persistAndFlush(unverifiedNewUser);
        
        // Make sure test user is verified
        testUser.setIsVerified(true);
        entityManager.persistAndFlush(testUser); // verified user
        
        // Manually update the created_at timestamp for the old user using native SQL 
        // to bypass JPA's @PrePersist behavior
        LocalDateTime oldCreationDate = LocalDateTime.now().minusDays(2);
        entityManager.getEntityManager().createNativeQuery(
            "UPDATE users SET created_at = ? WHERE id = ?")
            .setParameter(1, oldCreationDate)
            .setParameter(2, savedOldUser.getId())
            .executeUpdate();
        
        entityManager.flush();
        entityManager.clear();

        // Verify the data was set up correctly
        Optional<User> oldUserCheck = userRepository.findByEmail(oldEmail);
        assertTrue(oldUserCheck.isPresent(), "Old user should exist before deletion");
        assertFalse(oldUserCheck.get().getIsVerified(), "Old user should be unverified");
        
        Optional<User> newUserCheck = userRepository.findByEmail(newEmail);
        assertTrue(newUserCheck.isPresent(), "New user should exist");
        assertFalse(newUserCheck.get().getIsVerified(), "New user should be unverified");
        
        // Check initial counts
        long totalUsers = userRepository.count();
        long unverifiedUsers = userRepository.findAll().stream()
            .filter(u -> !u.getIsVerified())
            .count();
        
        System.out.println("Total users before delete: " + totalUsers);
        System.out.println("Unverified users before delete: " + unverifiedUsers);
        System.out.println("Cutoff date: " + cutoffDate);

        // Act
        int deletedCount = userRepository.deleteByIsVerifiedFalseAndCreatedAtBefore(cutoffDate);
        
        // Flush the delete operation
        entityManager.flush();
        // Clear again to ensure fresh queries
        entityManager.clear();

        // Check final counts
        long totalUsersAfter = userRepository.count();
        System.out.println("Total users after delete: " + totalUsersAfter);
        System.out.println("Deleted count returned: " + deletedCount);

        // Assert
        assertEquals(1, deletedCount, "Should delete exactly 1 user (the old unverified one)");
        assertTrue(userRepository.findByEmail(testUser.getEmail()).isPresent(), "Verified user should remain");
        assertFalse(userRepository.findByEmail(oldEmail).isPresent(), "Old unverified user should be deleted");
        assertTrue(userRepository.findByEmail(newEmail).isPresent(), "New unverified user should remain");
        assertEquals(totalUsers - 1, totalUsersAfter, "Total user count should decrease by 1");
    }

    @Test
    void findById_WhenUserExists_ReturnsUser() {
        // Arrange
        User savedUser = entityManager.persistAndFlush(testUser);

        // Act
        Optional<User> result = userRepository.findById(savedUser.getId());

        // Assert
        assertTrue(result.isPresent());
        assertEquals(savedUser.getId(), result.get().getId());
        assertEquals(testUser.getEmail(), result.get().getEmail());
    }

    @Test
    void emailUniqueConstraint_PreventsDuplicateEmails() {
        // Arrange - persist a user with a specific email
        User user = new User();
        user.setFullName("Original User");
        user.setEmail("duplicate.test@example.com"); // Specific email for this test
        user.setPhone("+11111111111");
        user.setPasswordHash("hashedPassword");
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
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
        user.setUpdatedAt(LocalDateTime.now());
        entityManager.persistAndFlush(user);
        
        // Create another user with the same email
        User duplicateEmailUser = new User();
        duplicateEmailUser.setFullName("Duplicate Email User");
        duplicateEmailUser.setEmail("duplicate.test@example.com"); // Same email as above
        duplicateEmailUser.setPhone("+22222222222"); // Different phone
        duplicateEmailUser.setPasswordHash("hashedPassword");
        duplicateEmailUser.setDateOfBirth(LocalDate.of(1992, 2, 2));
        duplicateEmailUser.setRole(User.Role.USER);
        duplicateEmailUser.setEmailAlerts(true);
        duplicateEmailUser.setSmsAlerts(true);
        duplicateEmailUser.setPushNotifications(true);
        duplicateEmailUser.setIsVerified(true);
        duplicateEmailUser.setIsAccountNonExpired(true);
        duplicateEmailUser.setIsAccountNonLocked(true);
        duplicateEmailUser.setIsCredentialsNonExpired(true);
        duplicateEmailUser.setIsEnabled(true);
        duplicateEmailUser.setCreatedAt(LocalDateTime.now());
        duplicateEmailUser.setUpdatedAt(LocalDateTime.now());

        // Act & Assert
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicateEmailUser);
        });
    }

    @Test
    void phoneUniqueConstraint_PreventsDuplicatePhones() {
        // Arrange - persist a user with a specific phone
        User user = new User();
        user.setFullName("Original Phone User");
        user.setEmail("phone.test@example.com");
        user.setPhone("+11111222222"); // Specific phone for this test
        user.setPasswordHash("hashedPassword");
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
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
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = entityManager.persistAndFlush(user);
        
        User duplicatePhoneUser = new User();
        duplicatePhoneUser.setFullName("Duplicate Phone User");
        duplicatePhoneUser.setEmail("different.email@example.com");
        duplicatePhoneUser.setPhone(savedUser.getPhone()); // Same phone
        duplicatePhoneUser.setPasswordHash("hashedPassword");
        duplicatePhoneUser.setDateOfBirth(LocalDate.of(1992, 2, 2));
        duplicatePhoneUser.setRole(User.Role.USER);
        duplicatePhoneUser.setEmailAlerts(true);
        duplicatePhoneUser.setSmsAlerts(true);
        duplicatePhoneUser.setPushNotifications(true);
        duplicatePhoneUser.setIsVerified(true);
        duplicatePhoneUser.setIsAccountNonExpired(true);
        duplicatePhoneUser.setIsAccountNonLocked(true);
        duplicatePhoneUser.setIsCredentialsNonExpired(true);
        duplicatePhoneUser.setIsEnabled(true);
        duplicatePhoneUser.setCreatedAt(LocalDateTime.now());
        duplicatePhoneUser.setUpdatedAt(LocalDateTime.now());

        // Act & Assert
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicatePhoneUser);
        });
    }
}
