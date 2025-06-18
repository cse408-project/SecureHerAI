package com.secureherai.secureherai_api.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.dto.notification.NotificationRequest;
import com.secureherai.secureherai_api.dto.notification.NotificationResponse;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.NotificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtService jwtService;

    /**
     * Update notification preferences for the authenticated user
     */
    @PutMapping("/update-preferences")
    public ResponseEntity<NotificationResponse.GenericResponse> updateNotificationPreferences(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody NotificationRequest.UpdatePreferences request) {        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID userId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new NotificationResponse.GenericResponse(false, null, "Unable to update preferences with invalid token"));
                }
                userId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GenericResponse(false, null, "Unable to update preferences with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GenericResponse(false, null, "Unable to update preferences with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GenericResponse(false, null, "Unable to update preferences with invalid token"));
            }
            
            // Extract preferences from request
            NotificationRequest.NotificationPreferences prefs = request.getPreferences();
            NotificationResponse.GenericResponse response = notificationService.updateNotificationPreferences(
                userId, 
                prefs.getEmailAlerts(), 
                prefs.getSmsAlerts(), 
                prefs.getPushNotifications()
            );
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new NotificationResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    /**
     * Get notification preferences for the authenticated user
     */    @GetMapping("/preferences")
    public ResponseEntity<NotificationResponse.GetPreferencesResponse> getNotificationPreferences(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new NotificationResponse.GetPreferencesResponse(false, null, "Unable to get preferences with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GetPreferencesResponse(false, null, "Unable to get preferences with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GetPreferencesResponse(false, null, "Unable to get preferences with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GetPreferencesResponse(false, null, "Unable to get preferences with invalid token"));
            }
            
            NotificationResponse.GetPreferencesResponse response = notificationService.getNotificationPreferences(tokenUserId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new NotificationResponse.GetPreferencesResponse(false, null, "An unexpected error occurred"));
        }
    }

    /**
     * Get alert notifications for a specific alert (Admin/Responder access)
     */
    @GetMapping("/alert/{alertId}")
    public ResponseEntity<List<NotificationResponse.AlertNotificationInfo>> getAlertNotifications(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID alertId) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // First validate token before extracting any claims
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Extract user role for authorization
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Only allow admins and responders to view alert notifications
            if (!"ADMIN".equals(userRole) && !"RESPONDER".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
              List<NotificationResponse.AlertNotificationInfo> notifications = notificationService.getAlertNotifications(alertId);
            return ResponseEntity.ok(notifications);

        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get failed notifications for retry (Admin access only)
     */
    @GetMapping("/failed")
    public ResponseEntity<List<NotificationResponse.AlertNotificationInfo>> getFailedNotifications(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // First validate token before extracting any claims
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Extract user role for authorization
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            // Only allow admins to view failed notifications
            if (!"ADMIN".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
              List<NotificationResponse.AlertNotificationInfo> failedNotifications = notificationService.getFailedNotifications();
            return ResponseEntity.ok(failedNotifications);

        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update notification status (Admin access only)
     */
    @PutMapping("/{notificationId}/status")
    public ResponseEntity<NotificationResponse.GenericResponse> updateNotificationStatus(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID notificationId,
            @RequestParam String status) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // First validate token before extracting any claims
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GenericResponse(false, null, "Unable to update notification status with invalid token"));
            }

            // Extract user role for authorization
            String userRole;
            try {
                userRole = jwtService.extractRole(token);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new NotificationResponse.GenericResponse(false, null, "Unable to update notification status with invalid token"));
            }

            // Only allow admins and responders to update notification status
            if (!"ADMIN".equals(userRole) && !"RESPONDER".equals(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new NotificationResponse.GenericResponse(false, null, "Insufficient permissions to update notification status"));
            }
            
            NotificationResponse.GenericResponse response = notificationService.updateNotificationStatus(notificationId, status);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new NotificationResponse.GenericResponse(false, null, "Unable to update notification status with invalid token"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new NotificationResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
}
