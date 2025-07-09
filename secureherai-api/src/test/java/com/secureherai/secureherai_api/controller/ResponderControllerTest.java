package com.secureherai.secureherai_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ResponderController.class)
@Import(TestSecurityConfig.class)
class ResponderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ResponderRepository responderRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private User responderUser;
    private Responder testResponder;
    private UUID testUserId;
    private String testEmail;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        testEmail = "responder@example.com";

        responderUser = new User();
        responderUser.setId(testUserId);
        responderUser.setEmail(testEmail);
        responderUser.setFullName("Test Responder");
        responderUser.setRole(User.Role.RESPONDER);

        testResponder = new Responder();
        testResponder.setUserId(testUserId);
        testResponder.setResponderType(Responder.ResponderType.POLICE);
        testResponder.setBadgeNumber("BADGE123");
        testResponder.setStatus(Responder.Status.AVAILABLE);
        testResponder.setIsActive(true);
    }

    @Test
    @WithMockUser(username = "responder@example.com", roles = {"RESPONDER"})
    void getResponderProfile_ValidResponder_ReturnsProfile() throws Exception {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(responderUser));
        when(responderRepository.findByUserId(testUserId)).thenReturn(Optional.of(testResponder));

        // Act & Assert
        mockMvc.perform(get("/api/responder/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.responderType").value("POLICE"))
                .andExpect(jsonPath("$.data.badgeNumber").value("BADGE123"))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));

        verify(userRepository).findByEmail(testEmail);
        verify(responderRepository).findByUserId(testUserId);
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = {"USER"})
    void getResponderProfile_NonResponderUser_ReturnsForbidden() throws Exception {
        // Arrange
        User regularUser = new User();
        regularUser.setId(testUserId);
        regularUser.setEmail("user@example.com");
        regularUser.setRole(User.Role.USER);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(regularUser));

        // Act & Assert
        mockMvc.perform(get("/api/responder/profile"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Access denied. User is not a responder"));

        verify(responderRepository, never()).findByUserId(any());
    }

    @Test
    @WithMockUser(username = "nonexistent@example.com", roles = {"RESPONDER"})
    void getResponderProfile_UserNotFound_ReturnsNotFound() throws Exception {
        // Arrange
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(get("/api/responder/profile"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("User not found"));

        verify(responderRepository, never()).findByUserId(any());
    }

    @Test
    @WithMockUser(username = "responder@example.com", roles = {"RESPONDER"})
    void updateAvailabilityStatus_ValidUpdate_ReturnsSuccess() throws Exception {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(responderUser));
        when(responderRepository.findByUserId(testUserId)).thenReturn(Optional.of(testResponder));
        when(responderRepository.save(any(Responder.class))).thenReturn(testResponder);

        String requestBody = "{\"status\": \"BUSY\"}";

        // Act & Assert
        mockMvc.perform(put("/api/responder/availability")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Availability status updated successfully"));

        verify(responderRepository).save(any(Responder.class));
    }

    @Test
    @WithMockUser(username = "responder@example.com", roles = {"RESPONDER"})
    void updateResponderProfile_ValidUpdate_ReturnsSuccess() throws Exception {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(responderUser));
        when(responderRepository.findByUserId(testUserId)).thenReturn(Optional.of(testResponder));
        when(responderRepository.save(any(Responder.class))).thenReturn(testResponder);

        String requestBody = "{\"badgeNumber\": \"NEWBADGE456\"}";

        // Act & Assert
        mockMvc.perform(put("/api/responder/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Profile updated successfully"));

        verify(responderRepository).save(any(Responder.class));
    }

    @Test
    @WithMockUser(username = "responder@example.com", roles = {"RESPONDER"})
    void updateAvailabilityStatus_ResponderNotFound_ReturnsNotFound() throws Exception {
        // Arrange
        when(userRepository.findByEmail(testEmail)).thenReturn(Optional.of(responderUser));
        when(responderRepository.findByUserId(testUserId)).thenReturn(Optional.empty());

        String requestBody = "{\"status\": \"OFF_DUTY\"}";

        // Act & Assert
        mockMvc.perform(put("/api/responder/availability")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value("Responder profile not found"));

        verify(responderRepository, never()).save(any());
    }

    @Test
    void getResponderProfile_NoAuthentication_ReturnsUnauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/responder/profile"))
                .andExpect(status().isUnauthorized());

        verify(userRepository, never()).findByEmail(any());
        verify(responderRepository, never()).findByUserId(any());
    }
}
