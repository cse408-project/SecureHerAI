package com.secureherai.secureherai_api.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@Transactional
class AuthIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgresql = new PostgreSQLContainer<>("postgres:15")
            .withDatabaseName("secureherai_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgresql::getJdbcUrl);
        registry.add("spring.datasource.username", postgresql::getUsername);
        registry.add("spring.datasource.password", postgresql::getPassword);
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void fullRegistrationFlow_WithValidData_Success() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("John Doe");
        registerRequest.setEmail("john.doe@example.com");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");

        // Act & Assert - Register
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful! Please check your email for verification."));

        // Verify user was created in database
        var users = userRepository.findAll();
        assert users.size() == 1;
        assert users.get(0).getEmail().equals("john.doe@example.com");
        assert users.get(0).getRole() == User.Role.USER;
    }

    @Test
    void fullLoginFlow_WithValidCredentials_Success() throws Exception {
        // Arrange - Create a user
        User user = new User();
        user.setFullName("John Doe");
        user.setEmail("john.doe@example.com");
        user.setPhone("+1234567890");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setDateOfBirth(LocalDate.of(1990, 1, 1));
        user.setRole(User.Role.USER);
        user.setEmailAlerts(true);
        user.setSmsAlerts(true);
        user.setPushNotifications(true);
        user.setIsVerified(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        AuthRequest.Login loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("password123");

        // Act & Assert - Login
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Login code sent to your email. Please check your inbox."));

        // Verify login code was set
        User updatedUser = userRepository.findByEmail("john.doe@example.com").orElseThrow();
        assert updatedUser.getLoginCode() != null;
        assert updatedUser.getLoginCodeExpiry() != null;
    }

    @Test
    void duplicateEmailRegistration_ReturnsConflict() throws Exception {
        // Arrange - Create existing user
        User existingUser = new User();
        existingUser.setFullName("Existing User");
        existingUser.setEmail("john.doe@example.com");
        existingUser.setPhone("+1111111111");
        existingUser.setPasswordHash(passwordEncoder.encode("password123"));
        existingUser.setRole(User.Role.USER);
        existingUser.setIsVerified(true);
        existingUser.setCreatedAt(LocalDateTime.now());
        existingUser.setUpdatedAt(LocalDateTime.now());
        userRepository.save(existingUser);

        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("John Doe");
        registerRequest.setEmail("john.doe@example.com"); // Same email
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already registered"));
    }

    @Test
    void loginWithInvalidCredentials_ReturnsUnauthorized() throws Exception {
        // Arrange
        AuthRequest.Login loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("wrongpassword");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void healthEndpoint_ReturnsOk() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));
    }

    @Test
    void registerResponder_CreatesResponderRecord() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Officer Smith");
        registerRequest.setEmail("officer.smith@police.gov");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("RESPONDER");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Registration successful! Please check your email for verification."));

        // Verify user was created with RESPONDER role
        User createdUser = userRepository.findByEmail("officer.smith@police.gov").orElseThrow();
        assert createdUser.getRole() == User.Role.RESPONDER;
    }
}
