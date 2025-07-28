package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.service.FCMService;
import com.secureherai.secureherai_api.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/push-notifications")
@RequiredArgsConstructor
@Slf4j
public class PushNotificationController {
    
    private final FCMService fcmService;
    private final JwtService jwtService;
    
    /**
     * Register FCM token for the authenticated user
     * 
     * POST /api/push-notifications/register
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerFCMToken(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid FCMTokenRequest request) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Authentication token is invalid or expired"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            UUID userId = jwtService.extractUserId(token);
            
            // Register FCM token
            boolean success = fcmService.registerFCMToken(
                userId, 
                request.getFcmToken(), 
                request.getDeviceName(),
                request.getBrowserInfo()
            );
            
            if (success) {
                Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "FCM token registered successfully",
                    "userId", userId
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Failed to register FCM token"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
            
        } catch (Exception e) {
            log.error("Error registering FCM token", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to register FCM token: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Unregister FCM token for the authenticated user
     * 
     * DELETE /api/push-notifications/unregister
     */
    @DeleteMapping("/unregister")
    public ResponseEntity<Map<String, Object>> unregisterFCMToken(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody(required = false) FCMTokenUnregisterRequest request) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Authentication token is invalid or expired"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            UUID userId = jwtService.extractUserId(token);
            boolean success;
            
            if (request != null && request.getFcmToken() != null && !request.getFcmToken().trim().isEmpty()) {
                // Unregister specific token
                success = fcmService.unregisterFCMToken(request.getFcmToken());
            } else {
                // Unregister all tokens for the user
                success = fcmService.unregisterAllTokensForUser(userId);
            }
            
            if (success) {
                Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "FCM token(s) unregistered successfully",
                    "userId", userId
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Failed to unregister FCM token(s)"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
            
        } catch (Exception e) {
            log.error("Error unregistering FCM token", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to unregister FCM token: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Send push notification (admin/system use)
     * 
     * POST /api/push-notifications/send
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendPushNotification(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid PushNotificationRequest request) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Authentication token is invalid or expired"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            // TODO: Add role-based authorization here for admin/system users
            
            boolean success = fcmService.sendNotificationToUsers(
                request.getRecipientIds(),
                request.getTitle(),
                request.getBody(),
                request.getData()
            );
            
            if (success) {
                Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "Push notification sent successfully",
                    "recipients", request.getRecipientIds().size()
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Failed to send push notification"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
            
        } catch (Exception e) {
            log.error("Error sending push notification", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to send push notification: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get device statistics for the authenticated user
     * 
     * GET /api/push-notifications/devices
     */
    @GetMapping("/devices")
    public ResponseEntity<Map<String, Object>> getUserDevices(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Authentication token is invalid or expired"
                );
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            UUID userId = jwtService.extractUserId(token);
            Map<String, Object> stats = fcmService.getUserDeviceStats(userId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", stats
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting user devices", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to get user devices: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // DTOs
    public static class FCMTokenRequest {
        private String fcmToken;
        private String deviceName;
        private String browserInfo;
        
        // Getters and setters
        public String getFcmToken() { return fcmToken; }
        public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
        
        public String getDeviceName() { return deviceName; }
        public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
        
        public String getBrowserInfo() { return browserInfo; }
        public void setBrowserInfo(String browserInfo) { this.browserInfo = browserInfo; }
    }
    
    public static class FCMTokenUnregisterRequest {
        private String fcmToken;
        
        public String getFcmToken() { return fcmToken; }
        public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }
    }
    
    public static class PushNotificationRequest {
        private List<UUID> recipientIds;
        private String title;
        private String body;
        private Map<String, String> data;
        
        // Getters and setters
        public List<UUID> getRecipientIds() { return recipientIds; }
        public void setRecipientIds(List<UUID> recipientIds) { this.recipientIds = recipientIds; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getBody() { return body; }
        public void setBody(String body) { this.body = body; }
        
        public Map<String, String> getData() { return data; }
        public void setData(Map<String, String> data) { this.data = data; }
    }
}
