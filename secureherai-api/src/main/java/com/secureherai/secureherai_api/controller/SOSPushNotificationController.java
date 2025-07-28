package com.secureherai.secureherai_api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.secureherai.secureherai_api.service.JwtService;
import com.google.auth.oauth2.GoogleCredentials;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Slf4j
public class SOSPushNotificationController {
    
    private final JwtService jwtService;
    
    @Value("${firebase.project.id:}")
    private String firebaseProjectId;
    
    @Value("${firebase.service.account.key:}")
    private String firebaseServiceAccountKey;
    
    /**
     * Send push notification for SOS alert
     * POST /api/alerts/send-push-notification
     */
    @PostMapping("/send-push-notification")
    public ResponseEntity<Map<String, Object>> sendSOSPushNotification(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody SOSPushNotificationRequest request) {
        
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
            log.info("Sending SOS push notification for user: {} to {} responders", userId, request.getResponderTokens().size());
            
            // Validate Firebase configuration is set up
            if (firebaseProjectId == null || firebaseProjectId.trim().isEmpty()) {
                log.error("Firebase project ID not configured");
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Push notification service not configured"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
            
            if (firebaseServiceAccountKey == null || firebaseServiceAccountKey.trim().isEmpty()) {
                log.error("Firebase service account key not configured");
                Map<String, Object> errorResponse = Map.of(
                    "success", false,
                    "message", "Push notification service not configured"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
            }
            
            // Send push notifications to all responder tokens
            int successCount = 0;
            int totalCount = request.getResponderTokens().size();
            
            for (String fcmToken : request.getResponderTokens()) {
                boolean success = sendPushNotificationToToken(fcmToken, request);
                if (success) {
                    successCount++;
                }
            }
            
            log.info("Successfully sent {} out of {} SOS push notifications", successCount, totalCount);
            
            Map<String, Object> response = Map.of(
                "success", successCount > 0,
                "message", String.format("Sent %d out of %d notifications", successCount, totalCount),
                "successCount", successCount,
                "totalCount", totalCount
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error sending SOS push notification", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to send push notification: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Send push notification to a single FCM token using HTTP v1 API
     */
    private boolean sendPushNotificationToToken(String fcmToken, SOSPushNotificationRequest request) {
        try {
            // Get OAuth2 access token
            String accessToken = getAccessToken();
            if (accessToken == null) {
                log.error("Failed to get OAuth2 access token");
                return false;
            }
            
            // Create FCM HTTP v1 API payload
            String payload = String.format("""
                {
                    "message": {
                        "token": "%s",
                        "notification": {
                            "title": "🚨 EMERGENCY ALERT",
                            "body": "Emergency assistance needed from %s at %s%s"
                        },
                        "data": {
                            "alertId": "%s",
                            "type": "SOS_ALERT",
                            "latitude": "%s",
                            "longitude": "%s",
                            "userLocation": "%s",
                            "userName": "%s",
                            "alertMessage": "%s",
                            "timestamp": "%s"
                        },
                        "webpush": {
                            "headers": {
                                "TTL": "300",
                                "Urgency": "high"
                            },
                            "notification": {
                                "title": "🚨 EMERGENCY ALERT",
                                "body": "Emergency assistance needed from %s at %s%s",
                                "icon": "/notification-icon.png",
                                "badge": "/badge-icon.png",
                                "requireInteraction": true,
                                "tag": "%s",
                                "actions": [
                                    {
                                        "action": "accept",
                                        "title": "Accept Alert"
                                    },
                                    {
                                        "action": "ignore",
                                        "title": "Ignore"
                                    }
                                ]
                            }
                        }
                    }
                }
                """,
                fcmToken,
                request.getUserName(),
                request.getUserLocation(),
                request.getAlertMessage() != null ? ". " + request.getAlertMessage() : "",
                request.getAlertId(),
                request.getLatitude() != null ? request.getLatitude().toString() : "",
                request.getLongitude() != null ? request.getLongitude().toString() : "",
                request.getUserLocation(),
                request.getUserName(),
                request.getAlertMessage() != null ? request.getAlertMessage() : "",
                String.valueOf(System.currentTimeMillis()),
                request.getUserName(),
                request.getUserLocation(),
                request.getAlertMessage() != null ? ". " + request.getAlertMessage() : "",
                request.getAlertId()
            );
            
            // Send to Firebase FCM HTTP v1 API endpoint
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://fcm.googleapis.com/v1/projects/" + firebaseProjectId + "/messages:send"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();
            
            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() == 200) {
                log.debug("Successfully sent push notification to token: {}", fcmToken.substring(0, 10) + "...");
                return true;
            } else {
                log.error("Failed to send push notification. Status: {}, Response: {}", response.statusCode(), response.body());
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error sending push notification to token: {}", fcmToken.substring(0, 10) + "...", e);
            return false;
        }
    }

    /**
     * Get OAuth2 access token for Firebase FCM HTTP v1 API
     */
    private String getAccessToken() {
        try {
            // Create credentials from service account key
            GoogleCredentials credentials = GoogleCredentials
                    .fromStream(new ByteArrayInputStream(firebaseServiceAccountKey.getBytes()))
                    .createScoped(Arrays.asList("https://www.googleapis.com/auth/firebase.messaging"));
            
            // Refresh token to get access token
            credentials.refresh();
            return credentials.getAccessToken().getTokenValue();
            
        } catch (IOException e) {
            log.error("Error getting Firebase access token", e);
            return null;
        }
    }
    
    // DTO for request
    public static class SOSPushNotificationRequest {
        private List<String> responderTokens;
        private String alertId;
        private String userLocation;
        private String userName;
        private String alertMessage;
        private Double latitude;
        private Double longitude;
        
        // Getters and setters
        public List<String> getResponderTokens() { return responderTokens; }
        public void setResponderTokens(List<String> responderTokens) { this.responderTokens = responderTokens; }
        
        public String getAlertId() { return alertId; }
        public void setAlertId(String alertId) { this.alertId = alertId; }
        
        public String getUserLocation() { return userLocation; }
        public void setUserLocation(String userLocation) { this.userLocation = userLocation; }
        
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        
        public String getAlertMessage() { return alertMessage; }
        public void setAlertMessage(String alertMessage) { this.alertMessage = alertMessage; }
        
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }
}
