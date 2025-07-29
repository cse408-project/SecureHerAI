package com.secureherai.secureherai_api.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.Collections;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.enums.AlertStatus;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.repository.TrustedContactRepository;
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
    private TrustedContactRepository trustedContactRepository;

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
            
            // Get all alerts that are pending for this responder
            // This includes:
            // 1. Active alerts with no AlertResponder record for this responder
            // 2. Active alerts with AlertResponder record status "pending" (forwarded alerts)
            // Exclude alerts that are "responded" (accepted by someone else)
            List<Alert> activeAlerts = alertRepository.findActiveAlerts();
            List<AlertResponder> responderAlerts = alertResponderRepository.findByResponderId(user.getId());
            
            // // DEBUG LOGGING
            // System.out.println("DEBUG - findByResponderId query for user: " + user.getId());
            // System.out.println("DEBUG - Found " + responderAlerts.size() + " AlertResponder records");
            // for (AlertResponder ar : responderAlerts) {
            //     System.out.println("  Found: alertId=" + ar.getAlertId() + ", status=" + ar.getStatus() + ", notes=" + ar.getNotes());
            // }
            // System.out.println("DEBUG - Active alerts found: " + activeAlerts.size());
            // for (Alert alert : activeAlerts) {
            //     System.out.println("  Active Alert: id=" + alert.getId() + ", status=" + alert.getStatus());
            // }
            
            // Create a map of alertId -> AlertResponder for this responder
            Map<UUID, AlertResponder> alertResponderMap = responderAlerts.stream()
                .collect(Collectors.toMap(
                    AlertResponder::getAlertId,
                    ar -> ar
                ));
            
            // DEBUG LOGGING - Remove after debugging
            // System.out.println("DEBUG - getPendingAlerts for user: " + user.getId());
            // System.out.println("DEBUG - Active alerts count: " + activeAlerts.size());
            // System.out.println("DEBUG - Responder alerts count: " + responderAlerts.size());
            // for (AlertResponder ar : responderAlerts) {
            //     System.out.println("  DEBUG - AlertResponder: alertId=" + ar.getAlertId() + 
            //                      ", status=" + ar.getStatus() + ", acceptedAt=" + ar.getAcceptedAt() + 
            //                      ", notes=" + ar.getNotes());
            // }
            
            // Filter alerts to show only pending ones for this responder:
            // INCLUDE:
            // 1. Active alerts with no AlertResponder record for this responder (new alerts)
            // 2. Active alerts with AlertResponder status "pending" (includes forwarded alerts)
            // EXCLUDE:
            // 3. Alerts with AlertResponder status "accepted", "rejected", "forwarded" (by this responder)
            // 4. Alerts with Alert.status "responded" (accepted by another responder)
            List<Map<String, Object>> pendingAlerts = activeAlerts.stream()
                .filter(alert -> {
                    // Skip alerts that have been responded to (accepted by someone else)
                    if (AlertStatus.ACCEPTED.equals(alert.getStatus())) {
                        // System.out.println("  DEBUG - Skipping alert " + alert.getId() + " - already responded");
                        return false;
                    }
                    
                    AlertResponder alertResponder = alertResponderMap.get(alert.getId());
                    if (alertResponder == null) {
                        // No record for this responder - include it (new alert)
                        // System.out.println("  DEBUG - Including alert " + alert.getId() + " - no record for this responder");
                        return true;
                    }
                    
                    // Only include if status is "pending"
                    boolean shouldInclude = AlertStatus.PENDING.equals(alertResponder.getStatus());
                    // System.out.println("  DEBUG - Alert " + alert.getId() + ": responder status=" + 
                    //                  alertResponder.getStatus() + ", shouldInclude=" + shouldInclude);
                    return shouldInclude;
                })
                .map(alert -> {
                    // Create alert data with additional fields
                    Map<String, Object> alertData = new HashMap<>();
                    alertData.put("id", alert.getId());
                    alertData.put("userId", alert.getUserId());
                    alertData.put("latitude", alert.getLatitude());
                    alertData.put("longitude", alert.getLongitude());
                    alertData.put("address", alert.getAddress());
                    alertData.put("status", alert.getStatus().getValue());
                    alertData.put("alertMessage", alert.getAlertMessage());
                    alertData.put("triggerMethod", alert.getTriggerMethod());
                    alertData.put("triggeredAt", alert.getTriggeredAt());
                    
                    // Check if this alert was forwarded to this responder
                    AlertResponder alertResponder = alertResponderMap.get(alert.getId());
                    if (alertResponder != null && "forwarded".equals(alertResponder.getNotes())) {
                        alertData.put("forwarded", true);
                    } else {
                        alertData.put("forwarded", false);
                    }
                    
                    return alertData;
                })
                .toList();
                
            // System.out.println("DEBUG - Final pending alerts count: " + pendingAlerts.size());
                
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
                user.getId(), AlertStatus.ACCEPTED);
            List<AlertResponder> criticalAlerts = alertResponderRepository.findByResponderIdAndStatus(
                user.getId(), AlertStatus.CRITICAL);
            acceptedAlerts.addAll(criticalAlerts);
                
            // TODO: Need to join with Alert entity to get full alert details
            // For now, return the basic alert responder data
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", acceptedAlerts.stream().map(this::createAlertResponderSummary).toList());
            response.put("message", "Accepted and Critical alerts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }
    
    /**
     * Get alert details including user information for a specific alert-responder combination
     * Uses the composite key (alertId + responderId) to fetch full alert and user details
     */
    @GetMapping("/alert-details/{alertId}")
    public ResponseEntity<Object> getAlertDetails(
            @PathVariable String alertId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID responderId = jwtService.extractUserId(token);
            UUID alertUuid = UUID.fromString(alertId);

            // Find the AlertResponder record using the composite key
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertUuid, responderId);
            
            if (alertResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not assigned to you"));
            }

            AlertResponder alertResponder = alertResponderOpt.get();
            
            // Get the full Alert details from the relationship
            Alert alert = alertResponder.getAlert();
            if (alert == null) {
                // If lazy loading didn't work, fetch it manually
                Optional<Alert> alertOpt = alertRepository.findById(alertUuid);
                if (alertOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert details not found"));
                }
                alert = alertOpt.get();
            }

            // Get user details from the alert's userId
            Optional<User> userOpt = userRepository.findById(alert.getUserId());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User details not found"));
            }

            User user = userOpt.get();

            // Create response with alert details and user information
            Map<String, Object> alertDetails = new HashMap<>();
            alertDetails.put("alertId", alert.getId());
            alertDetails.put("userId", alert.getUserId());
            alertDetails.put("latitude", alert.getLatitude());
            alertDetails.put("longitude", alert.getLongitude());
            alertDetails.put("address", alert.getAddress());
            alertDetails.put("triggerMethod", alert.getTriggerMethod());
            alertDetails.put("alertMessage", alert.getAlertMessage());
            alertDetails.put("audioRecording", alert.getAudioRecording());
            alertDetails.put("triggeredAt", alert.getTriggeredAt());
            alertDetails.put("status", alert.getStatus().getValue());
            alertDetails.put("verificationStatus", alert.getVerificationStatus());

            // Add user information
            Map<String, Object> userDetails = new HashMap<>();
            userDetails.put("userId", user.getId());
            userDetails.put("fullName", user.getFullName());
            userDetails.put("email", user.getEmail());
            userDetails.put("phoneNumber", user.getPhone());
            userDetails.put("profilePicture", user.getProfilePicture());
            userDetails.put("dateOfBirth", user.getDateOfBirth());
            
            // Add responder-specific information
            Map<String, Object> responderInfo = new HashMap<>();
            responderInfo.put("status", alertResponder.getStatus().getValue());
            responderInfo.put("acceptedAt", alertResponder.getAcceptedAt());
            responderInfo.put("arrivalTime", alertResponder.getArrivalTime());
            responderInfo.put("eta", alertResponder.getEta());
            responderInfo.put("notes", alertResponder.getNotes());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("alert", alertDetails);
            response.put("user", userDetails);
            response.put("responder", responderInfo);
            response.put("message", "Alert details retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Invalid alert ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Unexpected error occurred"));
        }
    }
    
    @PutMapping("/accept-alert")
    public ResponseEntity<Object> acceptAlert(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID responderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString(request.get("alertId"));

            // Verify the alert exists and is active
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty() || !alertOpt.get().getStatus().equals(AlertStatus.ACTIVE)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not active"));
            }

            Alert alert = alertOpt.get();

            // Check if AlertResponder record already exists
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);
            
            if (alertResponderOpt.isPresent()) {
                // Update existing record
                AlertResponder alertResponder = alertResponderOpt.get();
                alertResponder.setStatus(AlertStatus.ACCEPTED);
                alertResponder.setAcceptedAt(java.time.LocalDateTime.now());
                alertResponderRepository.save(alertResponder);
            } else {
                // Create new AlertResponder record with accepted status
                AlertResponder newAlertResponder = new AlertResponder(alertId, responderId, AlertStatus.ACCEPTED);
                newAlertResponder.setAcceptedAt(java.time.LocalDateTime.now());
                alertResponderRepository.save(newAlertResponder);
            }

            // Update the alert status to "responded" so other responders won't see it
            alert.setStatus(AlertStatus.ACCEPTED);
            alertRepository.save(alert);

            return ResponseEntity.ok(Map.of("success", true, "message", "Alert accepted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Unexpected error occurred"));
        }
    }

    @PutMapping("/reject-alert")
    public ResponseEntity<Object> rejectAlert(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID responderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString(request.get("alertId"));

            // Check if AlertResponder record already exists
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);
            
            if (alertResponderOpt.isPresent()) {
                // Update existing record
                AlertResponder alertResponder = alertResponderOpt.get();
                alertResponder.setStatus(AlertStatus.REJECTED);
                alertResponderRepository.save(alertResponder);
            } else {
                // Create new AlertResponder record with rejected status
                // First verify the alert exists and is active
                Optional<Alert> alertOpt = alertRepository.findById(alertId);
                if (alertOpt.isEmpty() || !alertOpt.get().getStatus().equals(AlertStatus.ACTIVE)) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not active"));
                }
                
                AlertResponder newAlertResponder = new AlertResponder(alertId, responderId, AlertStatus.REJECTED);
                alertResponderRepository.save(newAlertResponder);

                Alert alert = alertOpt.get();
                alert.setStatus(AlertStatus.REJECTED);
                alertRepository.save(alert);

            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Alert rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Unexpected error occurred"));
        }
    }

    @PutMapping("/forward-alert")
    public ResponseEntity<Object> forwardAlert(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID currentResponderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString(request.get("alertId"));
            String targetBadgeNumber = request.get("badgeNumber");

            if (targetBadgeNumber == null || targetBadgeNumber.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Badge number is required"));
            }

            // Find target responder by badge number
            Optional<Responder> targetResponderOpt = responderRepository.findByBadgeNumber(targetBadgeNumber);
            if (targetResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Responder with badge number not found"));
            }

            UUID targetResponderId = targetResponderOpt.get().getUserId();

            // Verify the alert exists and is active
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty() || !alertOpt.get().getStatus().equals(AlertStatus.ACTIVE)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not active"));
            }

            // Mark current responder's alert as forwarded (create record if doesn't exist)
            Optional<AlertResponder> currentAlertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, currentResponderId);

            // Always update the current responder's record to "forwarded" status (or create one if it doesn't exist)
            if (currentAlertResponderOpt.isPresent()) {
                AlertResponder currentAlertResponder = currentAlertResponderOpt.get();
                currentAlertResponder.setStatus(AlertStatus.FORWARDED);
                alertResponderRepository.save(currentAlertResponder);
                // System.out.println("DEBUG - Forward: Updated existing AlertResponder record to forwarded for current responder " + currentResponderId);
            } else {
                // Create new record for current responder with forwarded status
                AlertResponder newCurrentAlertResponder = new AlertResponder(alertId, currentResponderId, AlertStatus.FORWARDED);
                alertResponderRepository.save(newCurrentAlertResponder);
                // System.out.println("DEBUG - Forward: Created new AlertResponder record with forwarded status for current responder " + currentResponderId);
            }

            // Create or update AlertResponder record for target responder
            Optional<AlertResponder> targetAlertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, targetResponderId);

            // For target responder: always create a pending record if none exists, or update to pending if exists
            if (targetAlertResponderOpt.isEmpty()) {
                // No previous record, create new with forwarded=true flag
                AlertResponder newTargetAlertResponder = new AlertResponder(alertId, targetResponderId, AlertStatus.PENDING);
                newTargetAlertResponder.setNotes("forwarded"); // Use notes field to indicate it was forwarded
                alertResponderRepository.save(newTargetAlertResponder);
                // System.out.println("DEBUG - Forward: Created new AlertResponder with pending status for target " + targetResponderId);
            } else {
                // Already has record in any status, update to pending with forwarded flag
                AlertResponder targetAlertResponder = targetAlertResponderOpt.get();
                targetAlertResponder.setStatus(AlertStatus.PENDING);
                targetAlertResponder.setNotes("forwarded"); // Use notes field to indicate it was forwarded
                alertResponderRepository.save(targetAlertResponder);
                // System.out.println("DEBUG - Forward: Updated existing AlertResponder to pending status for target " + targetResponderId);
            }

            // Verify the target record was actually saved with correct data
            Optional<AlertResponder> verifyRecord = alertResponderRepository.findByAlertIdAndResponderId(alertId, targetResponderId);
            if (verifyRecord.isPresent()) {
                // System.out.println("DEBUG - Forward: Verification successful - Found saved record with status: " + 
                //                   verifyRecord.get().getStatus() + ", notes: " + verifyRecord.get().getNotes());
                return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Alert forwarded successfully to responder with badge " + targetBadgeNumber
                ));
            } else {
                // System.out.println("DEBUG - Forward: ERROR - Record not found after save operation!");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to save the forwarded alert record"));
            }
        } catch (Exception e) {
            // System.out.println("DEBUG - Forward: Exception occurred: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Unexpected error occurred: " + e.getMessage()));
        }
    }

    // @PutMapping("/update-alert-status")
    // public ResponseEntity<Object> updateAlertStatus(
    //         @RequestBody Map<String, String> request,
    //         @RequestHeader("Authorization") String authHeader) {
    //     try {
    //         String token = authHeader.replace("Bearer ", "");
    //         if (!jwtService.isTokenValid(token)) {
    //             return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
    //         }

    //         UUID responderId = jwtService.extractUserId(token);
    //         UUID alertId = UUID.fromString(request.get("alertId"));
    //         String newStatus = request.get("status");

    //         if (newStatus == null || newStatus.trim().isEmpty()) {
    //             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Status is required"));
    //         }

    //         // Validate status values
    //         // if (!isValidAlertStatus(newStatus)) {
    //         //     return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Invalid status. Must be one of: ACCEPTED, EN_ROUTE, ARRIVED, RESOLVED"));
    //         // }

    //         // Find the AlertResponder record
    //         Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);
            
    //         if (alertResponderOpt.isEmpty()) {
    //             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not assigned to you"));
    //         }

    //         AlertResponder alertResponder = alertResponderOpt.get();
    //         AlertStatus statusEnum = AlertStatus.fromString(newStatus);
    //         alertResponder.setStatus(statusEnum);
            
    //         // Set arrival time if status is "arrived"
    //         if (AlertStatus.RESOLVED.equals(statusEnum)) {
    //             alertResponder.setArrivalTime(java.time.LocalDateTime.now());
    //         }


            
    //         alertResponderRepository.save(alertResponder);

    //         return ResponseEntity.ok(Map.of("success", true, "message", "Alert status updated successfully"));
    //     } catch (Exception e) {
    //         return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Unexpected error occurred"));
    //     }
    // }
    
    
    // private boolean isValidAlertStatus(String status) {
    //     return AlertStatus.isValid(status) && 
    //            (AlertStatus.ACCEPTED.getValue().equals(status) || 
    //             AlertStatus.EN_ROUTE.getValue().equals(status) || 
    //             AlertStatus.ARRIVED.getValue().equals(status) || 
    //             AlertStatus.RESOLVED.getValue().equals(status));
    // }
    
    private Map<String, Object> createAlertResponderSummary(AlertResponder alertResponder) {
        Map<String, Object> data = new HashMap<>();
        data.put("alertId", alertResponder.getAlertId());
        data.put("responderId", alertResponder.getResponderId());
        data.put("status", alertResponder.getStatus().getValue());
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
    
    /**
     * Get all users and their contact information for responders
     */
    @GetMapping("/all-users-contacts")
    public ResponseEntity<Object> getAllUsersContacts(@RequestHeader("Authorization") String authHeader) {
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
            
            // Get all users
            List<User> allUsers = userRepository.findAll();
            
            // Get all responders
            List<Responder> allResponders = responderRepository.findAll();
            Map<UUID, Responder> responderMap = allResponders.stream()
                .collect(Collectors.toMap(Responder::getUserId, r -> r));
            
            // Get all trusted contacts
            List<TrustedContact> allTrustedContacts = trustedContactRepository.findAll();
            Map<UUID, List<TrustedContact>> contactsMap = allTrustedContacts.stream()
                .collect(Collectors.groupingBy(TrustedContact::getUserId));
            
            // Build response with user info and their contacts
            List<Map<String, Object>> userContactsData = allUsers.stream()
                .map(u -> {
                    Map<String, Object> userData = new HashMap<>();
                    userData.put("userId", u.getId());
                    userData.put("fullName", u.getFullName());
                    userData.put("email", u.getEmail());
                    userData.put("phone", u.getPhone());
                    userData.put("role", u.getRole().toString());
                    userData.put("profilePicture", u.getProfilePicture());
                    userData.put("dateOfBirth", u.getDateOfBirth());
                    userData.put("isVerified", u.getIsVerified());
                    
                    // Add responder info if user is a responder
                    if (u.getRole() == User.Role.RESPONDER && responderMap.containsKey(u.getId())) {
                        Responder responder = responderMap.get(u.getId());
                        Map<String, Object> responderInfo = new HashMap<>();
                        responderInfo.put("responderType", responder.getResponderType());
                        responderInfo.put("badgeNumber", responder.getBadgeNumber());
                        responderInfo.put("branchName", responder.getBranchName());
                        responderInfo.put("address", responder.getAddress());
                        responderInfo.put("status", responder.getStatus());
                        responderInfo.put("isActive", responder.getIsActive());
                        responderInfo.put("lastStatusUpdate", responder.getLastStatusUpdate());
                        userData.put("responderInfo", responderInfo);
                    }
                    
                    // Add trusted contacts for this user
                    List<TrustedContact> userContacts = contactsMap.getOrDefault(u.getId(), Collections.emptyList());
                    List<Map<String, Object>> contactsData = userContacts.stream()
                        .map(contact -> {
                            Map<String, Object> contactData = new HashMap<>();
                            contactData.put("contactId", contact.getId());
                            contactData.put("name", contact.getName());
                            contactData.put("phone", contact.getPhone());
                            contactData.put("email", contact.getEmail());
                            contactData.put("relationship", contact.getRelationship());
                            contactData.put("shareLocation", contact.getShareLocation());
                            contactData.put("createdAt", contact.getCreatedAt());
                            return contactData;
                        })
                        .collect(Collectors.toList());
                    userData.put("trustedContacts", contactsData);
                    
                    return userData;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", userContactsData);
            response.put("message", "All users and contacts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Internal server error"));
        }
    }

    /**
     * Get all alerts for the current responder (excluding ACTIVE and CANCELED)
     * GET /api/responder/my-alerts
     */
    @GetMapping("/my-alerts")
    public ResponseEntity<Map<String, Object>> getResponderMyAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(createErrorResponse("Authentication token is invalid or expired"));
            }
            
            // Get responder ID from token
            UUID responderId = jwtService.extractUserId(token);
            
            // Get all alert responder entries for this responder
            List<AlertResponder> alertResponders = alertResponderRepository.findByResponderId(responderId);
            
            // Filter out PENDING and REJECTED alerts and get alert details
            List<Map<String, Object>> alertsData = alertResponders.stream()
                .map(alertResponder -> {
                    // Only include alerts where the responder has ACCEPTED, RESOLVED, etc.
                    // Exclude PENDING (not yet acted upon) and REJECTED alerts
                    if (alertResponder.getStatus() == AlertStatus.PENDING || alertResponder.getStatus() == AlertStatus.REJECTED) {
                        return null;
                    }
                    // Get the full alert details
                    Optional<Alert> alertOpt = alertRepository.findById(alertResponder.getAlertId());
                    if (alertOpt.isPresent()) {
                        Alert alert = alertOpt.get();
                        
                        // Get user details
                        Optional<User> userOpt = userRepository.findById(alert.getUserId());
                        
                        Map<String, Object> alertData = new HashMap<>();
                        
                        // Alert information - using field names that match frontend expectations
                        alertData.put("id", alert.getId().toString()); // Use "id" not "alertId"
                        alertData.put("userId", alert.getUserId().toString());
                        alertData.put("latitude", alert.getLatitude());
                        alertData.put("longitude", alert.getLongitude());
                        alertData.put("address", alert.getAddress());
                        alertData.put("alertMessage", alert.getAlertMessage());
                        alertData.put("triggerMethod", alert.getTriggerMethod());
                        alertData.put("triggeredAt", alert.getTriggeredAt().toString());
                        alertData.put("status", alert.getStatus().getValue());
                        alertData.put("resolvedAt", alert.getResolvedAt() != null ? alert.getResolvedAt().toString() : null);
                        alertData.put("canceledAt", alert.getCanceledAt() != null ? alert.getCanceledAt().toString() : null);
                        
                        // Responder information
                        alertData.put("responderId", alertResponder.getResponderId().toString());
                        alertData.put("responderStatus", alertResponder.getStatus().getValue());
                        alertData.put("acceptedAt", alertResponder.getAcceptedAt() != null ? alertResponder.getAcceptedAt().toString() : null);
                        // Note: No rejectedAt field in AlertResponder entity
                        alertData.put("eta", alertResponder.getEta());
                        alertData.put("arrivalTime", alertResponder.getArrivalTime() != null ? alertResponder.getArrivalTime().toString() : null);
                        
                        // User information (if available)
                        if (userOpt.isPresent()) {
                            User user = userOpt.get();
                            alertData.put("userFullName", user.getFullName());
                            alertData.put("userEmail", user.getEmail());
                            alertData.put("userPhone", user.getPhone());
                        }
                        
                        return alertData;
                    }
                    return null;
                })
                .filter(alertData -> alertData != null) // Remove null entries (PENDING/REJECTED alerts)
                .sorted((a, b) -> {
                    // Sort by triggered time, most recent first
                    String timeA = (String) a.get("triggeredAt");
                    String timeB = (String) b.get("triggeredAt");
                    if (timeA == null && timeB == null) return 0;
                    if (timeA == null) return 1;
                    if (timeB == null) return -1;
                    return timeB.compareTo(timeA);
                })
                .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alertsData);
            response.put("count", alertsData.size());
            response.put("message", "Responder's historical alerts retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(createErrorResponse("Error retrieving responder's alerts: " + e.getMessage()));
        }
    }

}
