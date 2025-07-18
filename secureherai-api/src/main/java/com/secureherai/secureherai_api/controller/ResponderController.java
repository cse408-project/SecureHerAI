package com.secureherai.secureherai_api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.service.JwtService;
import com.secureherai.secureherai_api.repository.UserRepository;

@RestController
@RequestMapping("/api/responder")
public class ResponderController {

    @Autowired
    private ResponderRepository responderRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AlertResponderRepository alertResponderRepository;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/profile")
    public ResponseEntity<Object> getResponderProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
            if (responderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Responder profile not found"));
            }
            
            Responder responder = responderOpt.get();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", createResponderProfileData(user, responder));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Internal server error"));
        }
    }
    
    @GetMapping("/available")
    public ResponseEntity<Object> getAvailableResponders() {
        try {
            List<Responder> availableResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.AVAILABLE);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", availableResponders.stream().map(this::createResponderSummary).toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    @PutMapping("/status")
    public ResponseEntity<Object> updateResponderStatus(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Status is required"));
            }
            
            try {
                Responder.Status status = Responder.Status.valueOf(statusStr.toUpperCase());
                
                // Retry logic for optimistic locking failures
                int maxRetries = 3;
                for (int attempt = 0; attempt < maxRetries; attempt++) {
                    try {
                        Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
                        if (responderOpt.isEmpty()) {
                            return ResponseEntity.status(404).body(createErrorResponse("Responder profile not found"));
                        }
                        
                        Responder responder = responderOpt.get();
                        responder.setStatus(status);
                        responderRepository.save(responder);
                        
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Status updated successfully");
                        
                        return ResponseEntity.ok(response);
                        
                    } catch (OptimisticLockingFailureException e) {
                        if (attempt == maxRetries - 1) {
                            // Final attempt failed, return error
                            return ResponseEntity.status(409).body(createErrorResponse("Status update failed due to concurrent modification. Please try again."));
                        }
                        // Wait a short time before retrying
                        try {
                            Thread.sleep(50 * (attempt + 1)); // Progressive delay: 50ms, 100ms, 150ms
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            return ResponseEntity.status(500).body(createErrorResponse("Update interrupted"));
                        }
                    }
                }
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(400).body(createErrorResponse("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
        
        return ResponseEntity.status(500).body(createErrorResponse("Unexpected error occurred"));
    }
    
    @PutMapping("/availability")
    public ResponseEntity<Object> updateAvailabilityStatus(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            String statusStr = request.get("status");
            if (statusStr == null || statusStr.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Status is required"));
            }
            
            try {
                Responder.Status status = Responder.Status.valueOf(statusStr.toUpperCase());
                
                Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
                if (responderOpt.isEmpty()) {
                    return ResponseEntity.status(404).body(createErrorResponse("Responder profile not found"));
                }
                
                Responder responder = responderOpt.get();
                responder.setStatus(status);
                responderRepository.save(responder);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Availability status updated successfully");
                
                return ResponseEntity.ok(response);
                
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(400).body(createErrorResponse("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY"));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    
    @PutMapping("/profile")
    public ResponseEntity<Object> updateResponderProfile(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
            if (responderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Responder profile not found"));
            }
            
            Responder responder = responderOpt.get();
            
            // Update badge number if provided
            String badgeNumber = request.get("badgeNumber");
            if (badgeNumber != null && !badgeNumber.isEmpty()) {
                responder.setBadgeNumber(badgeNumber);
            }
            
            responderRepository.save(responder);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Profile updated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    
    /**
     * Get pending alerts for the responder (alerts they haven't accepted yet)
     */
    @GetMapping("/pending-alerts")
    public ResponseEntity<Object> getPendingAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            // Get all alerts that haven't been accepted by this responder
            // This requires getting active alerts and filtering out ones already accepted
            List<Alert> activeAlerts = alertRepository.findActiveAlerts();
            List<AlertResponder> acceptedAlerts = alertResponderRepository.findByResponderId(user.getId());
            List<UUID> acceptedAlertIds = acceptedAlerts.stream()
                .map(AlertResponder::getAlertId)
                .toList();
                
            // Filter out already accepted alerts
            List<Alert> pendingAlerts = activeAlerts.stream()
                .filter(alert -> !acceptedAlertIds.contains(alert.getId()))
                .toList();
                
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", pendingAlerts);
            response.put("message", "Pending alerts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    
    /**
     * Get accepted/assigned alerts for the responder
     */
    @GetMapping("/accepted-alerts")
    public ResponseEntity<Object> getAcceptedAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }
            
            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(createErrorResponse("Access denied. User is not a responder"));
            }
            
            // Get all alerts accepted by this responder
            List<AlertResponder> acceptedAlerts = alertResponderRepository.findByResponderIdAndStatus(
                user.getId(), "accepted");
                
            // TODO: Need to join with Alert entity to get full alert details
            // For now, return the basic alert responder data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", acceptedAlerts.stream().map(this::createAlertResponderSummary).toList());
            response.put("message", "Accepted alerts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    
    private Map<String, Object> createAlertResponderSummary(AlertResponder alertResponder) {
        Map<String, Object> data = new HashMap<>();
        data.put("alertId", alertResponder.getAlertId());
        data.put("responderId", alertResponder.getResponderId());
        data.put("status", alertResponder.getStatus());
        data.put("acceptedAt", alertResponder.getAcceptedAt());
        return data;
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", message);
        return response;
    }
    
    private Map<String, Object> createResponderProfileData(User user, Responder responder) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getId());
        data.put("fullName", user.getFullName());
        data.put("email", user.getEmail());
        data.put("phoneNumber", user.getPhone());
        data.put("responderType", responder.getResponderType());
        data.put("badgeNumber", responder.getBadgeNumber());
        data.put("status", responder.getStatus());
        data.put("isActive", responder.getIsActive());
        data.put("lastStatusUpdate", responder.getLastStatusUpdate());
        return data;
    }
    
    private Map<String, Object> createResponderSummary(Responder responder) {
        Map<String, Object> data = new HashMap<>();
        data.put("userId", responder.getUserId());
        data.put("fullName", responder.getUser().getFullName());
        data.put("responderType", responder.getResponderType());
        data.put("badgeNumber", responder.getBadgeNumber());
        data.put("status", responder.getStatus());
        data.put("lastStatusUpdate", responder.getLastStatusUpdate());
        return data;
    }
}
