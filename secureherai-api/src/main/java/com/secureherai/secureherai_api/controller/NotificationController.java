package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.notification.*;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Controller for notification endpoints
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    private final JwtService jwtService;
    
    /**
     * Get all notifications for the authenticated user
     * 
     * GET /api/notifications
     */
    @GetMapping
    public ResponseEntity<NotificationListResponseDto> getUserNotifications(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(NotificationListResponseDto.error("Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            
            if (page < 0 || size <= 0) {
                // Return all notifications without pagination
                List<NotificationResponseDto> notifications = notificationService.getUserNotifications(userId);
                long unreadCount = notificationService.countUnreadNotifications(userId);
                
                return ResponseEntity.ok(NotificationListResponseDto.success(
                    notifications, notifications.size(), unreadCount));
            } else {
                // Return paginated notifications
                Pageable pageable = PageRequest.of(page, size);
                Page<NotificationResponseDto> notificationsPage = notificationService.getUserNotifications(userId, pageable);
                long unreadCount = notificationService.countUnreadNotifications(userId);
                
                return ResponseEntity.ok(NotificationListResponseDto.success(
                    notificationsPage.getContent(), notificationsPage.getTotalElements(), unreadCount));
            }
            
        } catch (Exception e) {
            log.error("Error fetching notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationListResponseDto.error("Failed to fetch notifications: " + e.getMessage()));
        }
    }
    
    /**
     * Get unread notifications for the authenticated user
     * 
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<NotificationListResponseDto> getUnreadNotifications(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(NotificationListResponseDto.error("Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            
            List<NotificationResponseDto> unreadNotifications = notificationService.getUnreadNotifications(userId);
            
            return ResponseEntity.ok(NotificationListResponseDto.success(
                unreadNotifications, unreadNotifications.size(), unreadNotifications.size()));
                
        } catch (Exception e) {
            log.error("Error fetching unread notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(NotificationListResponseDto.error("Failed to fetch unread notifications: " + e.getMessage()));
        }
    }
    
    /**
     * Get notification count for the authenticated user
     * 
     * GET /api/notifications/count
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getNotificationCount(
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
            
            long unreadCount = notificationService.countUnreadNotifications(userId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "unreadCount", unreadCount
            );
            
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Error fetching notification count", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to fetch notification count: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Mark a notification as read
     * 
     * POST /api/notifications/mark-read
     */
    @PostMapping("/mark-read")
    public ResponseEntity<Map<String, Object>> markNotificationAsRead(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid NotificationMarkReadDto requestDto) {
        
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
            
            boolean marked = notificationService.markNotificationAsRead(requestDto.getNotificationId(), userId);
            
            if (marked) {
                Map<String, Object> response = Map.of(
                    "success", true,
                    "message", "Notification marked as read successfully"
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = Map.of(
                    "success", false,
                    "message", "Notification not found or already read"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
                
        } catch (Exception e) {
            log.error("Error marking notification as read", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to mark notification as read: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Mark all notifications as read for the authenticated user
     * 
     * POST /api/notifications/mark-all-read
     */
    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllNotificationsAsRead(
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
            
            int markedCount = notificationService.markAllNotificationsAsRead(userId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "All notifications marked as read successfully",
                "markedCount", markedCount
            );
            
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Error marking all notifications as read", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to mark all notifications as read: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Create a notification (admin/system use)
     * 
     * POST /api/notifications/create
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createNotification(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody @Valid NotificationCreateDto requestDto) {
        
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
            
            // Optional: Add role-based authorization here
            // For now, any authenticated user can create notifications
            
            NotificationResponseDto notification = notificationService.createNotification(requestDto);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Notification created successfully",
                "notification", notification
            );
            
            return ResponseEntity.ok(response);
                
        } catch (Exception e) {
            log.error("Error creating notification", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to create notification: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Accept emergency response (for responders)
     * 
     * POST /api/notifications/accept-emergency
     */
    @PostMapping("/accept-emergency")
    public ResponseEntity<Map<String, Object>> acceptEmergencyResponse(
            @RequestBody @Valid AcceptEmergencyDto request,
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
            
            // Handle the acceptance
            notificationService.handleResponderAcceptance(request.getAlertId(), userId);
            
            // Send confirmation notification to the person who triggered SOS
            notificationService.sendEmergencyAcceptedNotification(
                request.getAlertUserId(), 
                userId, 
                request.getResponderName()
            );
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "Emergency response accepted successfully",
                "alertId", request.getAlertId()
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error accepting emergency response", e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to accept emergency response: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Get all notifications for a specific alert (both in-app and email notifications)
     * 
     * GET /api/notifications/alert/{alertId}
     */
    @GetMapping("/alert/{alertId}")
    public ResponseEntity<Map<String, Object>> getNotificationsForAlert(
            @PathVariable String alertId,
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
            UUID alertUuid = UUID.fromString(alertId);
            
            log.info("Getting all notifications for alert: {} by user: {}", alertId, userId);
            
            Map<String, Object> response = notificationService.getAllNotificationsForAlert(alertUuid, userId);
            
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID format for alertId: {}", alertId, e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Invalid alert ID format"
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error getting notifications for alert: {}", alertId, e);
            Map<String, Object> errorResponse = Map.of(
                "success", false,
                "message", "Failed to get notifications for alert: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
