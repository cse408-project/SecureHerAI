package com.secureherai.secureherai_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.service.AuthService;
import com.secureherai.secureherai_api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(TestSecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void login_WithValidCredentials_ReturnsSuccess() throws Exception {
        // Arrange
        AuthRequest.Login loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("password123");
        
        AuthResponse.Success successResponse = new AuthResponse.Success("Login code sent to your email");
        when(authService.login(any(AuthRequest.Login.class))).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void login_WithInvalidCredentials_ReturnsUnauthorized() throws Exception {
        // Arrange
        AuthRequest.Login loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("john.doe@example.com");
        loginRequest.setPassword("wrongpassword");
        
        AuthResponse.Error errorResponse = new AuthResponse.Error("Invalid email or password");
        when(authService.login(any(AuthRequest.Login.class))).thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void login_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Login loginRequest = new AuthRequest.Login();
        loginRequest.setEmail("invalid-email"); // Invalid email format
        loginRequest.setPassword("password123");

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_WithMissingFields_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Login loginRequest = new AuthRequest.Login();
        // Missing email and password

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithValidData_ReturnsCreated() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");
        
        AuthResponse.Success successResponse = new AuthResponse.Success("Registration successful");
        when(authService.register(any(AuthRequest.Register.class))).thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void register_WithExistingEmail_ReturnsConflict() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");
        
        AuthResponse.Error errorResponse = new AuthResponse.Error("Email already registered");
        when(authService.register(any(AuthRequest.Register.class))).thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    void register_WithInvalidRole_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("INVALID_ROLE");
        
        AuthResponse.Error errorResponse = new AuthResponse.Error("Invalid role specified");
        when(authService.register(any(AuthRequest.Register.class))).thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid role specified"));
    }

    @Test
    void register_WithMissingRequiredFields_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        // Missing required fields

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithInvalidEmailFormat_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("invalid-email"); // Invalid email format
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithShortPassword_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("+1234567890");
        registerRequest.setPassword("123"); // Too short
        registerRequest.setRole("USER");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_WithInvalidPhoneNumber_ReturnsBadRequest() throws Exception {
        // Arrange
        AuthRequest.Register registerRequest = new AuthRequest.Register();
        registerRequest.setFullName("Jane Doe");
        registerRequest.setEmail("jane.doe@example.com");
        registerRequest.setPhoneNumber("123"); // Invalid phone format
        registerRequest.setPassword("password123");
        registerRequest.setRole("USER");

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }
}
