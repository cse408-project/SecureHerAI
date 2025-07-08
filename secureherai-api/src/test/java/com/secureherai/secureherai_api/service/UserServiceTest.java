package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.dto.user.CompleteProfileRequest;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResponderRepository responderRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(testUserId);
        testUser.setFullName("John Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPhone("+1234567890");
        testUser.setDateOfBirth(LocalDate.of(1990, 1, 1));
        testUser.setRole(User.Role.USER);
        testUser.setEmailAlerts(true);
        testUser.setSmsAlerts(true);
        testUser.setPushNotifications(true);
    }

    @Test
    void getProfile_WhenUserExists_ReturnsUserProfile() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        Object result = userService.getProfile(testUserId);

        // Assert
        assertInstanceOf(AuthResponse.Profile.class, result);
        AuthResponse.Profile profile = (AuthResponse.Profile) result;
        assertNotNull(profile.getData());
        assertEquals(testUser.getFullName(), profile.getData().getFullName());
        assertEquals(testUser.getEmail(), profile.getData().getEmail());
        
        verify(userRepository).findById(testUserId);
    }

    @Test
    void getProfile_WhenUserNotExists_ReturnsError() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act
        Object result = userService.getProfile(testUserId);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("User not found", error.getError());
        
        verify(userRepository).findById(testUserId);
    }

    @Test
    void getProfile_WhenUserIsResponder_ReturnsProfileWithResponderInfo() {
        // Arrange
        testUser.setRole(User.Role.RESPONDER);
        Responder responder = new Responder();
        responder.setUserId(testUserId);
        responder.setResponderType(Responder.ResponderType.POLICE);
        responder.setBadgeNumber("BADGE123");
        responder.setStatus(Responder.Status.AVAILABLE);
        responder.setIsActive(true);
        responder.setLastStatusUpdate(LocalDateTime.now());
        
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(responderRepository.findByUserId(testUserId)).thenReturn(Optional.of(responder));

        // Act
        Object result = userService.getProfile(testUserId);

        // Assert
        assertInstanceOf(AuthResponse.Profile.class, result);
        AuthResponse.Profile profile = (AuthResponse.Profile) result;
        assertNotNull(profile.getData().getResponderInfo());
        assertEquals("POLICE", profile.getData().getResponderInfo().getResponderType());
        assertEquals("BADGE123", profile.getData().getResponderInfo().getBadgeNumber());
        
        verify(userRepository).findById(testUserId);
        verify(responderRepository).findByUserId(testUserId);
    }

    @Test
    void updateProfile_WhenUserExists_UpdatesSuccessfully() {
        // Arrange
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setFullName("Jane Doe");
        request.setPhoneNumber("+9876543210");
        request.setProfilePicture("https://example.com/profile.jpg");
        
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByPhone(request.getPhoneNumber())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        Object result = userService.updateProfile(testUserId, request);

        // Assert
        assertFalse(result instanceof AuthResponse.Error);
        assertEquals("Jane Doe", testUser.getFullName());
        assertEquals("+9876543210", testUser.getPhone());
        assertEquals("https://example.com/profile.jpg", testUser.getProfilePicture());
        
        verify(userRepository).findById(testUserId);
        verify(userRepository).save(testUser);
    }

    @Test
    void updateProfile_WhenUserNotExists_ReturnsError() {
        // Arrange
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act
        Object result = userService.updateProfile(testUserId, request);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("User not found", error.getError());
        
        verify(userRepository).findById(testUserId);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_WhenPhoneNumberAlreadyTaken_ReturnsError() {
        // Arrange
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setPhoneNumber("+9876543210");
        
        User anotherUser = new User();
        anotherUser.setId(UUID.randomUUID());
        
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.findByPhone(request.getPhoneNumber())).thenReturn(Optional.of(anotherUser));

        // Act
        Object result = userService.updateProfile(testUserId, request);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("Phone number already in use", error.getError());
        
        verify(userRepository).findById(testUserId);
        verify(userRepository).findByPhone(request.getPhoneNumber());
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_WhenInvalidProfilePictureUrl_ReturnsError() {
        // Arrange
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setProfilePicture("invalid-url");
        
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        // Act
        Object result = userService.updateProfile(testUserId, request);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("Profile picture must be a valid URL"));
        
        verify(userRepository).findById(testUserId);
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateProfile_WhenEmptyFields_DoesNotUpdateEmptyFields() {
        // Arrange
        String originalName = testUser.getFullName();
        String originalPhone = testUser.getPhone();
        
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setFullName("   "); // Empty name
        request.setPhoneNumber(""); // Empty phone
        
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.updateProfile(testUserId, request);

        // Assert
        assertEquals(originalName, testUser.getFullName()); // Should not change
        assertEquals(originalPhone, testUser.getPhone()); // Should not change
        
        verify(userRepository).findById(testUserId);
        verify(userRepository).save(testUser);
    }
}
