package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.sos.SOSAlertResponseDto;
import com.secureherai.secureherai_api.dto.sos.SOSCancelAlertRequestDto;
import com.secureherai.secureherai_api.dto.sos.SOSTextCommandRequestDto;
import com.secureherai.secureherai_api.dto.sos.SOSVoiceUrlCommandRequestDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.SOSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for SOS alert endpoints (voice and text commands)
 */
@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
@Slf4j
public class SOSController {
    
    private final SOSService sosService;
    private final JwtService jwtService;
    
    /**
     * Process voice command from URL and create an alert if keyword is detected
     * 
     * POST /api/sos/voice-command
     */
    @PostMapping("/voice-command")
    public ResponseEntity<SOSAlertResponseDto> processVoiceCommand(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid SOSVoiceUrlCommandRequestDto requestDto) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new SOSAlertResponseDto(false, "Authentication token is invalid or expired"));
            }
            
            // Extract user ID from token
            UUID userId = jwtService.extractUserId(token);
            log.info("Processing voice command from URL for user: {}", userId);
            
            // Process the voice command
            Alert alert = sosService.processVoiceCommandFromUrl(
                userId,
                requestDto.getAudioUrl(),
                requestDto.getLocation()
            );
            
            // If no alert was created (no keywords detected), return appropriate response
            if (alert == null) {
                return ResponseEntity.ok(new SOSAlertResponseDto(
                    false, 
                    "Alert not triggered. No emergency keywords detected in the audio."
                ));
            }
            
            // Return success response with the created alert including all fields
            return ResponseEntity.status(HttpStatus.CREATED).body(new SOSAlertResponseDto(
                true,
                "SOS Alert triggered successfully",
                alert.getId(),
                alert.getUserId(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.getAddress(),
                alert.getTriggerMethod(),
                alert.getAlertMessage(),
                alert.getAudioRecording(),
                alert.getTriggeredAt(),
                alert.getStatus(),
                alert.getVerificationStatus(),
                alert.getCanceledAt(),
                alert.getResolvedAt()
            ));
            
        } catch (Exception e) {
            log.error("Error processing voice command from URL", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new SOSAlertResponseDto(
                    false, 
                    "Error processing voice command: " + e.getMessage()
                ));
        }
    }
    
    /**
     * Process text command and create an alert if keyword is detected
     * 
     * POST /api/sos/text-command
     */
    @PostMapping("/text-command")
    public ResponseEntity<SOSAlertResponseDto> processTextCommand(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid SOSTextCommandRequestDto requestDto) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new SOSAlertResponseDto(false, "Authentication token is invalid or expired"));
            }
            
            // Extract user ID from token
            UUID userId = jwtService.extractUserId(token);
            log.info("Processing text command for user: {}", userId);
            
            // Process the text command
            Alert alert = sosService.processTextCommand(
                userId,
                requestDto.getMessage(),
                requestDto.getKeyword(),
                requestDto.getLocation()
            );
            
            // If no alert was created (keyword is not "help"), return appropriate response
            if (alert == null) {
                return ResponseEntity.ok(new SOSAlertResponseDto(
                    false, 
                    "Alert not triggered. Keyword must be 'help'."
                ));
            }
            
            // Return success response with the created alert including all fields
            return ResponseEntity.status(HttpStatus.CREATED).body(new SOSAlertResponseDto(
                true,
                "SOS Alert triggered successfully",
                alert.getId(),
                alert.getUserId(),
                alert.getLatitude(),
                alert.getLongitude(),
                alert.getAddress(),
                alert.getTriggerMethod(),
                alert.getAlertMessage(),
                alert.getAudioRecording(),
                alert.getTriggeredAt(),
                alert.getStatus(),
                alert.getVerificationStatus(),
                alert.getCanceledAt(),
                alert.getResolvedAt()
            ));
            
        } catch (Exception e) {
            log.error("Error processing text command", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new SOSAlertResponseDto(
                    false, 
                    "Error processing text command: " + e.getMessage()
                ));
        }
    }
    
    /**
     * Get all alerts for the authenticated user
     * 
     * GET /api/sos/alerts
     */
    @GetMapping("/alerts")
    public ResponseEntity<?> getUserAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication token is invalid or expired"));
            }
            
            // Extract user ID from token
            UUID userId = jwtService.extractUserId(token);
            log.info("Getting alerts for user: {}", userId);
            
            // Get user alerts
            List<Alert> alerts = sosService.getUserAlerts(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "alerts", alerts
            ));
            
        } catch (Exception e) {
            log.error("Error retrieving user alerts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error retrieving alerts: " + e.getMessage()));
        }
    }
    
    /**
     * Get all active alerts (only for responders)
     * 
     * GET /api/sos/active-alerts
     */
    @GetMapping("/active-alerts")
    public ResponseEntity<?> getActiveAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Authentication token is invalid or expired"));
            }
            
            // Check if user is a responder
            String role = jwtService.extractRole(token);
            if (!"RESPONDER".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Only responders can access this endpoint"));
            }
            
            // Extract user ID from token (for logging)
            UUID userId = jwtService.extractUserId(token);
            log.info("Responder {} requesting all active alerts", userId);
            
            // Get all active alerts
            List<Alert> activeAlerts = sosService.getActiveAlerts();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "alerts", activeAlerts
            ));
            
        } catch (Exception e) {
            log.error("Error retrieving active alerts", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "Error retrieving active alerts: " + e.getMessage()));
        }
    }
    
    /**
     * Cancel an alert
     * 
     * POST /api/sos/cancel
     */
    @PostMapping("/cancel")
    public ResponseEntity<SOSAlertResponseDto> cancelAlert(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid SOSCancelAlertRequestDto requestDto) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new SOSAlertResponseDto(false, "Authentication token is invalid or expired"));
            }
            
            // Extract user ID from token
            UUID userId = jwtService.extractUserId(token);
            log.info("User {} attempting to cancel alert {}", userId, requestDto.getAlertId());
            
            // Cancel the alert
            Alert updatedAlert = sosService.cancelAlert(requestDto.getAlertId(), userId);
            
            if (updatedAlert == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new SOSAlertResponseDto(false, "Alert not found or you are not authorized to cancel it"));
            }
            
            // Return success response with the updated alert
            return ResponseEntity.ok(new SOSAlertResponseDto(
                true,
                "Alert canceled successfully",
                updatedAlert.getId(),
                updatedAlert.getUserId(),
                updatedAlert.getLatitude(),
                updatedAlert.getLongitude(),
                updatedAlert.getAddress(),
                updatedAlert.getTriggerMethod(),
                updatedAlert.getAlertMessage(),
                updatedAlert.getAudioRecording(),
                updatedAlert.getTriggeredAt(),
                updatedAlert.getStatus(),
                updatedAlert.getVerificationStatus(),
                updatedAlert.getCanceledAt(),
                updatedAlert.getResolvedAt()
            ));
            
        } catch (Exception e) {
            log.error("Error canceling alert", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new SOSAlertResponseDto(
                    false, 
                    "Error canceling alert: " + e.getMessage()
                ));
        }
    }
}
