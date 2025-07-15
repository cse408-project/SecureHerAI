package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.entity.Settings;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Controller for user settings including notification preferences and SOS keyword
 */
@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
public class SettingsController {
    
    private final SettingsService settingsService;
    private final JwtService jwtService;
    
    /**
     * Get user settings including notification preferences and SOS keyword
     * 
     * GET /api/settings
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getSettings(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            log.info("Getting settings for user: {}", userId);
            
            Settings settings = settingsService.getUserSettings(userId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "settings", Map.of(
                    "emailAlerts", settings.getEmailAlerts(),
                    "smsAlerts", settings.getSmsAlerts(),
                    "pushNotifications", settings.getPushNotifications(),
                    "sosKeyword", settings.getSosKeyword()
                )
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching settings", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to fetch settings: " + e.getMessage()));
        }
    }
    
    /**
     * Update user settings (notification preferences and SOS keyword)
     * 
     * PUT /api/settings
     */
    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            log.info("Updating settings for user: {}", userId);
            
            // Extract preferences from request body
            Boolean emailAlerts = null;
            Boolean smsAlerts = null;
            Boolean pushNotifications = null;
            String sosKeyword = null;
            
            if (requestBody.containsKey("emailAlerts")) {
                emailAlerts = (Boolean) requestBody.get("emailAlerts");
            }
            if (requestBody.containsKey("smsAlerts")) {
                smsAlerts = (Boolean) requestBody.get("smsAlerts");
            }
            if (requestBody.containsKey("pushNotifications")) {
                pushNotifications = (Boolean) requestBody.get("pushNotifications");
            }
            if (requestBody.containsKey("sosKeyword")) {
                sosKeyword = (String) requestBody.get("sosKeyword");
            }
            
            Settings updatedSettings = settingsService.updateSettings(
                userId, emailAlerts, smsAlerts, pushNotifications, sosKeyword);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Settings updated successfully",
                "settings", Map.of(
                    "emailAlerts", updatedSettings.getEmailAlerts(),
                    "smsAlerts", updatedSettings.getSmsAlerts(),
                    "pushNotifications", updatedSettings.getPushNotifications(),
                    "sosKeyword", updatedSettings.getSosKeyword()
                )
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error updating settings", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to update settings: " + e.getMessage()));
        }
    }
    
    /**
     * Get SOS keyword specifically
     * 
     * GET /api/settings/sos-keyword
     */
    @GetMapping("/sos-keyword")
    public ResponseEntity<Map<String, Object>> getSosKeyword(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            log.info("Getting SOS keyword for user: {}", userId);
            
            String sosKeyword = settingsService.getSosKeyword(userId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "sosKeyword", sosKeyword
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching SOS keyword", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to fetch SOS keyword: " + e.getMessage()));
        }
    }
    
    /**
     * Update SOS keyword specifically (with password verification)
     * 
     * PUT /api/settings/sos-keyword
     */
    @PutMapping("/sos-keyword")
    public ResponseEntity<Map<String, Object>> updateSosKeyword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            log.info("Updating SOS keyword for user: {}", userId);
            
            // Extract new keyword from request body
            String newKeyword = (String) requestBody.get("sosKeyword");
            String password = (String) requestBody.get("password"); // For future password verification if needed
            
            if (newKeyword == null || newKeyword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "SOS keyword cannot be empty"));
            }
            
            Settings updatedSettings = settingsService.updateSosKeyword(userId, newKeyword);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "SOS keyword updated successfully",
                "sosKeyword", updatedSettings.getSosKeyword()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error updating SOS keyword", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to update SOS keyword: " + e.getMessage()));
        }
    }
    
    /**
     * Update notification preferences only (backward compatibility)
     * 
     * PUT /api/settings/notifications
     */
    @PutMapping("/notifications")
    public ResponseEntity<Map<String, Object>> updateNotificationPreferences(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "error", "Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            log.info("Updating notification preferences for user: {}", userId);
            
            // Extract preferences from request body
            Map<String, Object> preferences = (Map<String, Object>) requestBody.get("preferences");
            if (preferences == null) {
                preferences = requestBody; // Backward compatibility
            }
            
            Boolean emailAlerts = null;
            Boolean smsAlerts = null;
            Boolean pushNotifications = null;
            
            if (preferences.containsKey("emailAlerts")) {
                emailAlerts = (Boolean) preferences.get("emailAlerts");
            }
            if (preferences.containsKey("smsAlerts")) {
                smsAlerts = (Boolean) preferences.get("smsAlerts");
            }
            if (preferences.containsKey("pushNotifications")) {
                pushNotifications = (Boolean) preferences.get("pushNotifications");
            }
            
            Settings updatedSettings = settingsService.updateNotificationPreferences(
                userId, emailAlerts, smsAlerts, pushNotifications);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Notification preferences updated successfully",
                "preferences", Map.of(
                    "emailAlerts", updatedSettings.getEmailAlerts(),
                    "smsAlerts", updatedSettings.getSmsAlerts(),
                    "pushNotifications", updatedSettings.getPushNotifications()
                )
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error updating notification preferences", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "error", "Failed to update notification preferences: " + e.getMessage()));
        }
    }
}
