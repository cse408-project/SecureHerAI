package com.secureherai.secureherai_api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.dto.sos.SOSTextCommandRequestDto;
import com.secureherai.secureherai_api.dto.sos.SOSVoiceUrlCommandRequestDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.SOSService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SOSController.class)
@Import(TestSecurityConfig.class)
class SOSControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SOSService sosService;

    @MockBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    private UUID testUserId;
    private String validToken;
    private Alert testAlert;
    private LocationDto locationDto;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        validToken = "valid.jwt.token";
        
        // Setup location data
        locationDto = new LocationDto();
        locationDto.setLatitude(BigDecimal.valueOf(23.8103));
        locationDto.setLongitude(BigDecimal.valueOf(90.4125));
        locationDto.setAddress("Dhaka, Bangladesh");
        
        // Setup test alert
        testAlert = new Alert();
        testAlert.setId(UUID.randomUUID());
        testAlert.setUserId(testUserId);
        testAlert.setLatitude(locationDto.getLatitude());
        testAlert.setLongitude(locationDto.getLongitude());
        testAlert.setAddress(locationDto.getAddress());
        testAlert.setTriggerMethod("text");
        testAlert.setAlertMessage("Help me, emergency!");
        testAlert.setTriggeredAt(LocalDateTime.now());
        testAlert.setStatus("active");
        
        // Setup JWT validation
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(testUserId);
    }

    @Test
    void processTextCommand_ValidRequest_ReturnsCreated() throws Exception {
        // Arrange
        SOSTextCommandRequestDto requestDto = new SOSTextCommandRequestDto();
        requestDto.setMessage("Help me, emergency!");
        requestDto.setKeyword("help");
        requestDto.setLocation(locationDto);
        
        when(sosService.processTextCommand(eq(testUserId), anyString(), eq("help"), any(LocationDto.class)))
            .thenReturn(testAlert);

        // Act & Assert
        mockMvc.perform(post("/api/sos/text-command")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alertId").isNotEmpty());
        
        verify(sosService).processTextCommand(eq(testUserId), anyString(), eq("help"), any(LocationDto.class));
    }
    
    @Test
    void processTextCommand_NoKeywordDetected_ReturnsOk() throws Exception {
        // Arrange
        SOSTextCommandRequestDto requestDto = new SOSTextCommandRequestDto();
        requestDto.setMessage("This is a normal message");
        requestDto.setKeyword("test");  // Not "help"
        requestDto.setLocation(locationDto);
        
        when(sosService.processTextCommand(eq(testUserId), anyString(), eq("test"), any(LocationDto.class)))
            .thenReturn(null); // No alert created

        // Act & Assert
        mockMvc.perform(post("/api/sos/text-command")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false));
        
        verify(sosService).processTextCommand(eq(testUserId), anyString(), eq("test"), any(LocationDto.class));
    }

    // Utility method for string matching in JSON response
    private static org.hamcrest.Matcher<String> containsString(String substring) {
        return org.hamcrest.Matchers.containsString(substring);
    }
    
    @Test
    void processTextCommand_InvalidToken_ReturnsUnauthorized() throws Exception {
        // Arrange
        String invalidToken = "invalid.jwt.token";
        SOSTextCommandRequestDto requestDto = new SOSTextCommandRequestDto();
        requestDto.setMessage("Help me!");
        requestDto.setKeyword("help");
        requestDto.setLocation(locationDto);
        
        when(jwtService.isTokenValid(invalidToken)).thenReturn(false);

        // Act & Assert
        mockMvc.perform(post("/api/sos/text-command")
                .header("Authorization", "Bearer " + invalidToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isUnauthorized());
        
        verify(sosService, never()).processTextCommand(any(), anyString(), anyString(), any(LocationDto.class));
    }
    
    @Test
    void processVoiceUrlCommand_ValidRequest_ReturnsCreated() throws Exception {
        // Arrange
        SOSVoiceUrlCommandRequestDto requestDto = new SOSVoiceUrlCommandRequestDto();
        requestDto.setAudioUrl("https://example.com/audio.wav");
        requestDto.setLocation(locationDto);
        
        when(sosService.processVoiceCommandFromUrl(eq(testUserId), anyString(), any(LocationDto.class)))
            .thenReturn(testAlert);

        // Act & Assert
        mockMvc.perform(post("/api/sos/voice-command")
                .header("Authorization", "Bearer " + validToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alertId").isNotEmpty());
        
        verify(sosService).processVoiceCommandFromUrl(eq(testUserId), anyString(), any(LocationDto.class));
    }

    @Test
    void getUserAlerts_ReturnsListOfAlerts() throws Exception {
        // Arrange
        when(sosService.getUserAlerts(testUserId)).thenReturn(java.util.Arrays.asList(testAlert));

        // Act & Assert
        mockMvc.perform(get("/api/sos/alerts")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alerts").isArray())
                .andExpect(jsonPath("$.alerts.length()").value(1));
        
        verify(sosService).getUserAlerts(testUserId);
    }

    @Test
    void getActiveAlerts_ValidResponder_ReturnsListOfActiveAlerts() throws Exception {
        // Arrange
        when(jwtService.extractRole(validToken)).thenReturn("RESPONDER");
        when(sosService.getActiveAlerts()).thenReturn(java.util.Arrays.asList(testAlert));

        // Act & Assert
        mockMvc.perform(get("/api/sos/active-alerts")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.alerts").isArray())
                .andExpect(jsonPath("$.alerts.length()").value(1));
        
        verify(sosService).getActiveAlerts();
    }
    
    @Test
    void getActiveAlerts_NonResponderRole_ReturnsForbidden() throws Exception {
        // Arrange
        when(jwtService.extractRole(validToken)).thenReturn("USER");

        // Act & Assert
        mockMvc.perform(get("/api/sos/active-alerts")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isForbidden());
        
        verify(sosService, never()).getActiveAlerts();
    }
}
