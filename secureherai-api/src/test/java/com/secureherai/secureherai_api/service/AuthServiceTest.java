package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResponderRepository responderRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private AuthRequest.Login loginRequest;
    private AuthRequest.Register registerRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setFullName("John Doe");
        testUser.setEmail("john.doe@example.com");
        testUser.setPhone("+1234567890");
        testUser.setPasswordHash("hashedPassword");
        testUser.setRole(User.Role.USER);
        testUser.setOauthProvider(null);

        loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("password123");

        registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("+9876543210");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");
    }

    @Test
    void login_WithValidCredentials_SendsLoginCode() {
        // Arrange
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(emailService).sendLoginCodeEmail(anyString(), anyString(), anyString());

        // Act
        Object result = authService.login(loginRequest);

        // Assert
        assertInstanceOf(AuthResponse.Success.class, result);
        AuthResponse.Success success = (AuthResponse.Success) result;
        assertTrue(success.getMessage().contains("Login code sent"));
        
        verify(userRepository).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPasswordHash());
        verify(userRepository).save(testUser);
        verify(emailService).sendLoginCodeEmail(eq(testUser.getEmail()), eq(testUser.getFullName()), anyString());
        
        // Check that login code was set
        assertNotNull(testUser.getLoginCode());
        assertNotNull(testUser.getLoginCodeExpiry());
    }

    @Test
    void login_WithInvalidEmail_ReturnsError() {
        // Arrange
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.empty());

        // Act
        Object result = authService.login(loginRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("Invalid email or password", error.getError());
        
        verify(userRepository).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(emailService, never()).sendLoginCodeEmail(anyString(), anyString(), anyString());
    }

    @Test
    void login_WithInvalidPassword_ReturnsError() {
        // Arrange
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(false);

        // Act
        Object result = authService.login(loginRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("Invalid email or password", error.getError());
        
        verify(userRepository).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder).matches(loginRequest.getPassword(), testUser.getPasswordHash());
        verify(emailService, never()).sendLoginCodeEmail(anyString(), anyString(), anyString());
    }

    @Test
    void login_WithGoogleOAuthUser_ReturnsError() {
        // Arrange
        testUser.setOauthProvider("GOOGLE");
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));

        // Act
        Object result = authService.login(loginRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("registered with Google"));
        
        verify(userRepository).findByEmail(loginRequest.getEmail());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(emailService, never()).sendLoginCodeEmail(anyString(), anyString(), anyString());
    }

    @Test
    void login_WhenEmailServiceFails_ReturnsError() {
        // Arrange
        when(userRepository.findByEmail(loginRequest.getEmail())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(loginRequest.getPassword(), testUser.getPasswordHash())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doThrow(new RuntimeException("Email service error")).when(emailService)
                .sendLoginCodeEmail(anyString(), anyString(), anyString());

        // Act
        Object result = authService.login(loginRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("Failed to send login code"));
        
        verify(userRepository, times(2)).save(testUser); // Once to set code, once to clear it
        verify(emailService).sendLoginCodeEmail(anyString(), anyString(), anyString());
    }

    @Test
    void register_WithValidData_CreatesUser() {
        // Arrange
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.existsByPhone(registerRequest.getPhoneNumber())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        
        // Important: Create a User that will be returned from userRepository.save
        User createdUser = new User();
        createdUser.setId(UUID.randomUUID());
        createdUser.setFullName(registerRequest.getFullName());
        createdUser.setEmail(registerRequest.getEmail());
        createdUser.setPhone(registerRequest.getPhoneNumber());
        createdUser.setPasswordHash("hashedPassword");
        createdUser.setRole(User.Role.USER);
        createdUser.setIsVerified(false);
        createdUser.setEmailAlerts(true);
        createdUser.setSmsAlerts(true);
        createdUser.setPushNotifications(true);
        createdUser.setIsAccountNonExpired(true);
        createdUser.setIsAccountNonLocked(true);
        createdUser.setIsCredentialsNonExpired(true);
        createdUser.setIsEnabled(true);
        
        when(userRepository.save(any(User.class))).thenReturn(createdUser);
        doNothing().when(emailService).sendWelcomeEmail(anyString(), anyString());

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Success.class, result);
        AuthResponse.Success success = (AuthResponse.Success) result;
        assertTrue(success.getMessage().contains("successful"), "Registration message should indicate success");
        
        verify(userRepository).findByEmail(registerRequest.getEmail());
        verify(userRepository).existsByPhone(registerRequest.getPhoneNumber());
        verify(passwordEncoder).encode(registerRequest.getPassword());
        verify(userRepository).save(any(User.class));
        verify(emailService).sendWelcomeEmail(registerRequest.getEmail(), registerRequest.getFullName());
    }

    @Test
    void register_WithExistingEmail_ReturnsError() {
        // Arrange
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.of(testUser));

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("Email already registered", error.getError());
        
        verify(userRepository).findByEmail(registerRequest.getEmail());
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendWelcomeEmail(anyString(), anyString());
    }

    @Test
    void register_WithGoogleOAuthExistingUser_ReturnsError() {
        // Arrange
        testUser.setOauthProvider("GOOGLE");
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.of(testUser));

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("registered with Google"));
        
        verify(userRepository).findByEmail(registerRequest.getEmail());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_WithExistingPhone_ReturnsError() {
        // Arrange
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.existsByPhone(registerRequest.getPhoneNumber())).thenReturn(true);

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertEquals("Phone number already registered", error.getError());
        
        verify(userRepository).findByEmail(registerRequest.getEmail());
        verify(userRepository).existsByPhone(registerRequest.getPhoneNumber());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_WithInvalidRole_ReturnsError() {
        // Arrange
        registerRequest.setRole("INVALID_ROLE");
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.existsByPhone(registerRequest.getPhoneNumber())).thenReturn(false);

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("Invalid role"));
        
        verify(userRepository).findByEmail(registerRequest.getEmail());
        verify(userRepository).existsByPhone(registerRequest.getPhoneNumber());
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_WithNullRole_ReturnsError() {
        // Arrange
        registerRequest.setRole(null);
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.existsByPhone(registerRequest.getPhoneNumber())).thenReturn(false);

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Error.class, result);
        AuthResponse.Error error = (AuthResponse.Error) result;
        assertTrue(error.getError().contains("Role is required"));
    }

    @Test
    void register_WithResponderRole_CreatesUserAndResponder() {
        // Arrange
        registerRequest.setRole("RESPONDER");
        registerRequest.setResponderType("POLICE");
        registerRequest.setBadgeNumber("BADGE123");
        
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.existsByPhone(registerRequest.getPhoneNumber())).thenReturn(false);
        when(responderRepository.existsByBadgeNumber(registerRequest.getBadgeNumber())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("hashedPassword");
        
        // Create a responder user that will be returned from userRepository.save
        User responderUser = new User();
        responderUser.setId(UUID.randomUUID());
        responderUser.setFullName(registerRequest.getFullName());
        responderUser.setEmail(registerRequest.getEmail());
        responderUser.setPhone(registerRequest.getPhoneNumber());
        responderUser.setPasswordHash("hashedPassword");
        responderUser.setRole(User.Role.RESPONDER);
        responderUser.setIsVerified(false);
        responderUser.setEmailAlerts(true);
        responderUser.setSmsAlerts(true);
        responderUser.setPushNotifications(true);
        responderUser.setIsAccountNonExpired(true);
        responderUser.setIsAccountNonLocked(true);
        responderUser.setIsCredentialsNonExpired(true);
        responderUser.setIsEnabled(true);
        
        when(userRepository.save(any(User.class))).thenReturn(responderUser);
        when(responderRepository.save(any(Responder.class))).thenReturn(new Responder());
        doNothing().when(emailService).sendWelcomeEmail(eq(registerRequest.getEmail()), eq(registerRequest.getFullName()));

        // Act
        Object result = authService.register(registerRequest);

        // Assert
        assertInstanceOf(AuthResponse.Success.class, result);
        
        verify(userRepository).save(any(User.class));
        verify(responderRepository).save(any(Responder.class));
        verify(emailService).sendWelcomeEmail(eq(registerRequest.getEmail()), eq(registerRequest.getFullName()));
    }
}
