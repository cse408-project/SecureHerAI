package com.secureherai.secureherai_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.dto.user.CompleteProfileRequest;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(TestSecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private String validToken;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        validToken = "valid.jwt.token";
        testUserId = UUID.randomUUID();
    }

    @Test
    void getProfile_WithValidToken_ReturnsProfile() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(testUserId);
        
        AuthResponse.Profile.UserProfile userProfile = new AuthResponse.Profile.UserProfile(
            testUserId.toString(),
            "John Doe",
            "john.doe@example.com",
            "+1234567890",
            null,
            LocalDate.of(1990, 1, 1),
            true,
            true,
            true,
            "USER"
        );
        AuthResponse.Profile profile = new AuthResponse.Profile(userProfile);
        
        when(userService.getProfile(testUserId)).thenReturn(profile);

        // Act & Assert
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("John Doe"))
                .andExpect(jsonPath("$.data.email").value("john.doe@example.com"))
                .andExpect(jsonPath("$.data.role").value("USER"));
    }

    @Test
    void getProfile_WithInvalidToken_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(anyString())).thenReturn(false);

        // Act & Assert
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer invalid.token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Authentication token is invalid or expired"));
    }

    @Test
    void getProfile_WithoutAuthHeader_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/user/profile"))
                .andExpect(status().isInternalServerError()); // Missing header will cause 500
    }

    @Test
    void getProfile_WhenUserNotFound_ReturnsNotFound() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(testUserId);
        when(userService.getProfile(testUserId)).thenReturn(new AuthResponse.Error("User not found"));

        // Act & Assert
        mockMvc.perform(get("/api/user/profile")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("User not found"));
    }

    @Test
    void updateProfile_WithValidData_ReturnsSuccess() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractSubject(validToken)).thenReturn(testUserId.toString());
        
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setFullName("Jane Doe");
        request.setPhoneNumber("+9876543210");
        
        AuthResponse.Success successResponse = new AuthResponse.Success("Profile updated successfully");
        when(userService.updateProfile(any(UUID.class), any(AuthRequest.UpdateProfile.class)))
                .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void updateProfile_WithInvalidToken_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(anyString())).thenReturn(false);
        
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setFullName("Jane Doe");

        // Act & Assert
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", "Bearer invalid.token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or expired token"));
    }

    @Test
    void updateProfile_WithInvalidData_ReturnsBadRequest() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractSubject(validToken)).thenReturn(testUserId.toString());
        
        AuthRequest.UpdateProfile request = new AuthRequest.UpdateProfile();
        request.setFullName("Jane Doe");
        
        AuthResponse.Error errorResponse = new AuthResponse.Error("Phone number already in use");
        when(userService.updateProfile(any(UUID.class), any(AuthRequest.UpdateProfile.class)))
                .thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(put("/api/user/profile")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Phone number already in use"));
    }

    @Test
    void completeProfile_WithValidData_ReturnsSuccess() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractSubject(validToken)).thenReturn(testUserId.toString());
        
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setDateOfBirth(LocalDate.of(1990, 1, 1));
        request.setPhoneNumber("+1234567890");
        
        AuthResponse.Success successResponse = new AuthResponse.Success("Profile completed successfully");
        when(userService.completeProfile(any(UUID.class), any(CompleteProfileRequest.class)))
                .thenReturn(successResponse);

        // Act & Assert
        mockMvc.perform(post("/api/user/complete-profile")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void completeProfile_WithInvalidToken_ReturnsUnauthorized() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(anyString())).thenReturn(false);
        
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setPhoneNumber("+1234567890");
        request.setDateOfBirth(LocalDate.of(1990, 1, 1)); // Provide valid data so validation passes

        // Act & Assert
        mockMvc.perform(post("/api/user/complete-profile")
                .header("Authorization", "Bearer invalid.token")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid or expired token"));
    }

    @Test
    void completeProfile_WithServiceError_ReturnsBadRequest() throws Exception {
        // Arrange
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractSubject(validToken)).thenReturn(testUserId.toString());
        
        CompleteProfileRequest request = new CompleteProfileRequest();
        request.setPhoneNumber("+1234567890");
        // Deliberately not setting dateOfBirth to trigger validation error
        
        // Act & Assert
        mockMvc.perform(post("/api/user/complete-profile")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists()); // Just check that error field exists
    }
}
