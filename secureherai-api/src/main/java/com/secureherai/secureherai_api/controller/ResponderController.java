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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
            }

            Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
            if (responderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Responder profile not found"));
            }

            Responder responder = responderOpt.get();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", createResponderProfileData(user, responder));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Internal server error"));
        }
    }

    @GetMapping("/available")
    public ResponseEntity<Object> getAvailableResponders() {
        try {
            List<Responder> availableResponders = responderRepository
                    .findByStatusAndIsActiveTrue(Responder.Status.AVAILABLE);

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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
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
                            return ResponseEntity.status(409).body(createErrorResponse(
                                    "Status update failed due to concurrent modification. Please try again."));
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
                return ResponseEntity.status(400)
                        .body(createErrorResponse("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY"));
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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
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
                return ResponseEntity.status(400)
                        .body(createErrorResponse("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY"));
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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
            }

            Optional<Responder> responderOpt = responderRepository.findByUserId(user.getId());
            if (responderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Responder profile not found"));
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
     * Search for responders by badge number, name, or branch.
     * Used for the forward alert modal to select target responders.
     */
    @GetMapping("/search")
    public ResponseEntity<Object> searchResponders(
            @RequestHeader("Authorization") String authHeader,
            @org.springframework.web.bind.annotation.RequestParam(required = false, defaultValue = "") String query) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID currentUserId = jwtService.extractUserId(token);

            // Get responders matching the query, excluding current user
            List<Responder> responders;
            if (query == null || query.trim().isEmpty()) {
                responders = responderRepository.findAllActiveExcept(currentUserId);
            } else {
                responders = responderRepository.searchResponders(query.trim(), currentUserId);
            }

            // Convert to response format with user details
            List<Map<String, Object>> responderList = new java.util.ArrayList<>();
            for (Responder responder : responders) {
                Optional<User> userOpt = userRepository.findById(responder.getUserId());
                if (userOpt.isEmpty())
                    continue;

                User user = userOpt.get();
                Map<String, Object> data = new HashMap<>();
                data.put("id", responder.getUserId());
                data.put("badgeNumber", responder.getBadgeNumber());
                data.put("fullName", user.getFullName());
                data.put("email", user.getEmail());
                data.put("branchName", responder.getBranchName());
                data.put("status", responder.getStatus().name());
                responderList.add(data);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", responderList);
            response.put("message", "Responders retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Internal server error"));
        }
    }

    /**
     * Get pending alerts for the responder (alerts they've been notified about or
     * forwarded to them)
     * Shows alerts where responder has PENDING or FORWARDED status in
     * AlertResponder.
     * This ensures batching works correctly - responders only see alerts they were
     * notified for.
     */
    @GetMapping("/pending-alerts")
    public ResponseEntity<Object> getPendingAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
            }

            // Get pending and forwarded records for this responder (only for ACTIVE alerts)
            List<AlertResponder> pendingRecords = alertResponderRepository.findPendingOrForwardedForResponder(
                    user.getId());

            // Convert to response format
            List<Map<String, Object>> pendingAlerts = new java.util.ArrayList<>();
            for (AlertResponder ar : pendingRecords) {
                Optional<Alert> alertOpt = alertRepository.findById(ar.getAlertId());
                if (alertOpt.isEmpty())
                    continue;

                Alert alert = alertOpt.get();

                // Create alert data with full details
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

                // Include severity for proper priority display (AI-analyzed)
                alertData.put("severity", alert.getSeverity() != null ? alert.getSeverity() : "MEDIUM");
                alertData.put("incidentType", alert.getIncidentType());

                // Responder-specific status (PENDING or FORWARDED)
                alertData.put("responderStatus", ar.getStatus().getValue());
                alertData.put("createdAt", ar.getCreatedAt());

                // Check if this alert was forwarded to this responder
                boolean isForwarded = ar.isForwarded();
                alertData.put("forwarded", isForwarded);
                if (isForwarded && ar.getForwardedFromResponderId() != null) {
                    // Get forwarder's name
                    Optional<User> forwarderOpt = userRepository.findById(ar.getForwardedFromResponderId());
                    if (forwarderOpt.isPresent()) {
                        alertData.put("forwardedFrom", forwarderOpt.get().getFullName());
                    }
                    alertData.put("forwardedAt", ar.getForwardedAt());
                }

                // Get victim's name
                Optional<User> victimOpt = userRepository.findById(alert.getUserId());
                if (victimOpt.isPresent()) {
                    alertData.put("victimName", victimOpt.get().getFullName());
                    alertData.put("victimPhone", victimOpt.get().getPhone());
                }

                // Include batch information for debugging
                String notes = ar.getNotes();
                if (notes != null && notes.startsWith("batch_")) {
                    alertData.put("batchNumber", notes.replace("batch_", ""));
                }

                pendingAlerts.add(alertData);
            }

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
     * Get accepted/active alerts for the responder (ACCEPTED, EN_ROUTE, ARRIVED
     * status)
     */
    @GetMapping("/accepted-alerts")
    public ResponseEntity<Object> getAcceptedAlerts(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token and validate
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
            }

            // Get all active responses for this responder (ACCEPTED, EN_ROUTE, ARRIVED)
            List<AlertResponder> activeAlerts = alertResponderRepository.findActiveForResponder(user.getId());

            // Join with Alert entity to get full alert details
            List<Map<String, Object>> alertsWithDetails = activeAlerts.stream()
                    .map(ar -> createAlertResponderWithFullDetails(ar))
                    .toList();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alertsWithDetails);
            response.put("message", "Active alerts retrieved successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse("Internal server error"));
        }
    }

    /**
     * Get alert details including user information for a specific alert-responder
     * combination
     * Uses the composite key (alertId + responderId) to fetch full alert and user
     * details
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
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertUuid,
                    responderId);

            if (alertResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found or not assigned to you"));
            }

            AlertResponder alertResponder = alertResponderOpt.get();

            // Get the full Alert details from the relationship
            Alert alert = alertResponder.getAlert();
            if (alert == null) {
                // If lazy loading didn't work, fetch it manually
                Optional<Alert> alertOpt = alertRepository.findById(alertUuid);
                if (alertOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(createErrorResponse("Alert details not found"));
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred"));
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

            // Verify the alert exists and is waiting or active
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found"));
            }
            Alert alert = alertOpt.get();
            AlertStatus alertStatus = alert.getStatus();

            // Only WAITING or ACTIVE alerts can be accepted
            // WAITING = no one accepted yet, ACTIVE = someone already accepted (allow
            // multiple responders)
            if (!AlertStatus.WAITING.equals(alertStatus) && !AlertStatus.ACTIVE.equals(alertStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse(
                                "Alert cannot be accepted - current status: " + alertStatus.getValue()));
            }

            // Store severity for response
            String severity = alert.getSeverity() != null ? alert.getSeverity() : "MEDIUM";

            // Check if AlertResponder record already exists
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    responderId);

            if (alertResponderOpt.isPresent()) {
                // Update existing record
                AlertResponder alertResponder = alertResponderOpt.get();
                // Only PENDING or FORWARDED can transition to ACCEPTED
                if (!AlertStatus.PENDING.equals(alertResponder.getStatus()) &&
                        !AlertStatus.FORWARDED.equals(alertResponder.getStatus())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Cannot accept alert - current responder status: " +
                                    alertResponder.getStatus().getValue()));
                }
                alertResponder.setStatus(AlertStatus.ACCEPTED);
                alertResponder.setAcceptedAt(java.time.LocalDateTime.now());
                alertResponderRepository.save(alertResponder);
            } else {
                // Create new AlertResponder record with accepted status
                AlertResponder newAlertResponder = new AlertResponder(alertId, responderId, AlertStatus.ACCEPTED);
                newAlertResponder.setAcceptedAt(java.time.LocalDateTime.now());
                alertResponderRepository.save(newAlertResponder);
            }

            // Delete all other PENDING AlertResponder records for this alert
            // This removes the alert from other responders' pending lists
            alertResponderRepository.deleteOtherPendingByAlertId(alertId, responderId);

            // Set alert status to ACTIVE when someone accepts (if it was WAITING)
            if (AlertStatus.WAITING.equals(alertStatus)) {
                alert.setStatus(AlertStatus.ACTIVE);
                alertRepository.save(alert);
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Alert accepted successfully",
                    "severity", severity));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred"));
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

            // First verify the alert exists and is ongoing (WAITING or ACTIVE)
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found"));
            }
            AlertStatus alertStatus = alertOpt.get().getStatus();
            if (!alertStatus.isAlertOngoing()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse(
                                "Alert is not active - current status: " + alertStatus.getValue()));
            }

            // Check if AlertResponder record exists
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    responderId);

            if (alertResponderOpt.isPresent()) {
                AlertResponder alertResponder = alertResponderOpt.get();
                // Only PENDING or FORWARDED can be rejected
                if (!AlertStatus.PENDING.equals(alertResponder.getStatus()) &&
                        !AlertStatus.FORWARDED.equals(alertResponder.getStatus())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Cannot reject alert - current responder status: " +
                                    alertResponder.getStatus().getValue()));
                }
                alertResponder.setStatus(AlertStatus.REJECTED);
                alertResponderRepository.save(alertResponder);
            } else {
                // Create new AlertResponder record with rejected status
                AlertResponder newAlertResponder = new AlertResponder(alertId, responderId, AlertStatus.REJECTED);
                alertResponderRepository.save(newAlertResponder);
            }

            // Alert status does not change - it stays WAITING/ACTIVE for other responders

            return ResponseEntity.ok(Map.of("success", true, "message", "Alert rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred"));
        }
    }

    /**
     * Forward an alert to one or more responders.
     * The forwarder's record is updated to FORWARDED status.
     * New PENDING records are created for target responders with
     * forwardedFromResponderId set.
     * 
     * Request body can contain either:
     * - "responderIds": array of responder user IDs (preferred)
     * - "badgeNumber": single badge number (legacy support)
     */
    @PutMapping("/forward-alert")
    public ResponseEntity<Object> forwardAlert(
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID currentResponderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString((String) request.get("alertId"));

            // Verify the alert exists and is ongoing (WAITING or ACTIVE)
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found"));
            }
            AlertStatus alertStatus = alertOpt.get().getStatus();
            if (!alertStatus.isAlertOngoing()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse(
                                "Alert is not active - current status: " + alertStatus.getValue()));
            }

            // Verify the current responder has PENDING status for this alert
            Optional<AlertResponder> currentAlertResponderOpt = alertResponderRepository
                    .findByAlertIdAndResponderId(alertId, currentResponderId);

            if (currentAlertResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("You don't have this alert assigned"));
            }

            AlertResponder currentAlertResponder = currentAlertResponderOpt.get();
            if (!AlertStatus.PENDING.equals(currentAlertResponder.getStatus()) &&
                    !AlertStatus.FORWARDED.equals(currentAlertResponder.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Cannot forward alert - current responder status: " +
                                currentAlertResponder.getStatus().getValue()));
            }

            // Get target responder IDs - either from array or single badge number
            java.util.List<UUID> targetResponderIds = new java.util.ArrayList<>();

            @SuppressWarnings("unchecked")
            java.util.List<String> responderIdStrings = (java.util.List<String>) request.get("responderIds");
            if (responderIdStrings != null && !responderIdStrings.isEmpty()) {
                // New format: array of responder IDs
                for (String idStr : responderIdStrings) {
                    targetResponderIds.add(UUID.fromString(idStr));
                }
            } else {
                // Legacy format: single badge number
                String targetBadgeNumber = (String) request.get("badgeNumber");
                if (targetBadgeNumber == null || targetBadgeNumber.trim().isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Either responderIds or badgeNumber is required"));
                }
                Optional<Responder> targetResponderOpt = responderRepository.findByBadgeNumber(targetBadgeNumber);
                if (targetResponderOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(createErrorResponse("Responder with badge number not found"));
                }
                targetResponderIds.add(targetResponderOpt.get().getUserId());
            }

            // Validate all target responders exist and are not the current responder
            for (UUID targetId : targetResponderIds) {
                if (targetId.equals(currentResponderId)) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(createErrorResponse("Cannot forward to yourself"));
                }
            }

            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            int forwardedCount = 0;

            // Create PENDING records for each target responder with forward tracking
            for (UUID targetResponderId : targetResponderIds) {
                Optional<AlertResponder> targetAlertResponderOpt = alertResponderRepository
                        .findByAlertIdAndResponderId(alertId, targetResponderId);

                if (targetAlertResponderOpt.isEmpty()) {
                    // Create new record with forwarding info
                    AlertResponder newTargetAlertResponder = new AlertResponder(alertId, targetResponderId,
                            AlertStatus.PENDING);
                    newTargetAlertResponder.setForwardedFromResponderId(currentResponderId);
                    newTargetAlertResponder.setForwardedAt(now);
                    newTargetAlertResponder.setNotes("forwarded");
                    alertResponderRepository.save(newTargetAlertResponder);
                    forwardedCount++;
                } else {
                    AlertResponder targetAlertResponder = targetAlertResponderOpt.get();
                    // Only update if not already accepted/resolved
                    if (AlertStatus.REJECTED.equals(targetAlertResponder.getStatus()) ||
                            AlertStatus.CANCELED.equals(targetAlertResponder.getStatus())) {
                        // Re-assign to pending with forward info
                        targetAlertResponder.setStatus(AlertStatus.PENDING);
                        targetAlertResponder.setForwardedFromResponderId(currentResponderId);
                        targetAlertResponder.setForwardedAt(now);
                        targetAlertResponder.setNotes("forwarded");
                        alertResponderRepository.save(targetAlertResponder);
                        forwardedCount++;
                    }
                    // Skip if already PENDING, ACCEPTED, EN_ROUTE, ARRIVED, or RESOLVED
                }
            }

            // Update forwarder's record to FORWARDED status
            currentAlertResponder.setStatus(AlertStatus.FORWARDED);
            alertResponderRepository.save(currentAlertResponder);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Alert forwarded successfully to " + forwardedCount + " responder(s)",
                    "forwardedCount", forwardedCount));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred: " + e.getMessage()));
        }
    }

    /**
     * Cancel an accepted alert - responder can no longer respond.
     * Only ACCEPTED, EN_ROUTE, or ARRIVED statuses can be canceled.
     */
    @PutMapping("/cancel-alert")
    public ResponseEntity<Object> cancelAlert(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID responderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString(request.get("alertId"));
            String reason = request.get("reason");

            // Verify the alert exists
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found"));
            }

            // Find the AlertResponder record
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    responderId);

            if (alertResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not assigned to you"));
            }

            AlertResponder alertResponder = alertResponderOpt.get();
            AlertStatus currentStatus = alertResponder.getStatus();

            // Only ACCEPTED, EN_ROUTE, or ARRIVED can be canceled
            if (!AlertStatus.ACCEPTED.equals(currentStatus) &&
                    !AlertStatus.EN_ROUTE.equals(currentStatus) &&
                    !AlertStatus.ARRIVED.equals(currentStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Cannot cancel alert - current status: " + currentStatus.getValue()));
            }

            // Update to CANCELED status
            alertResponder.setStatus(AlertStatus.CANCELED);
            if (reason != null && !reason.trim().isEmpty()) {
                alertResponder.setNotes("canceled: " + reason);
            }
            alertResponderRepository.save(alertResponder);

            return ResponseEntity.ok(Map.of("success", true, "message", "Alert canceled successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred"));
        }
    }

    /**
     * Update responder status for an alert (EN_ROUTE, ARRIVED, RESOLVED).
     * Responder can only update their own AlertResponder status.
     */
    @PutMapping("/update-status")
    public ResponseEntity<Object> updateAlertResponderStatus(
            @RequestBody Map<String, String> request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid token"));
            }

            UUID responderId = jwtService.extractUserId(token);
            UUID alertId = UUID.fromString(request.get("alertId"));
            String newStatusStr = request.get("status");

            if (newStatusStr == null || newStatusStr.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Status is required"));
            }

            // Parse the new status
            AlertStatus newStatus;
            try {
                newStatus = AlertStatus.fromString(newStatusStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Invalid status: " + newStatusStr));
            }

            // Only EN_ROUTE, ARRIVED, RESOLVED are valid transitions
            if (!AlertStatus.EN_ROUTE.equals(newStatus) &&
                    !AlertStatus.ARRIVED.equals(newStatus) &&
                    !AlertStatus.RESOLVED.equals(newStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Invalid status. Must be EN_ROUTE, ARRIVED, or RESOLVED"));
            }

            // Verify the alert exists
            Optional<Alert> alertOpt = alertRepository.findById(alertId);
            if (alertOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not found"));
            }

            // Find the AlertResponder record
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId,
                    responderId);

            if (alertResponderOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse("Alert not assigned to you"));
            }

            AlertResponder alertResponder = alertResponderOpt.get();
            AlertStatus currentStatus = alertResponder.getStatus();

            // Validate status transition
            if (!currentStatus.canTransitionTo(newStatus)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Cannot transition from " + currentStatus.getValue() +
                                " to " + newStatus.getValue()));
            }

            // Update status
            alertResponder.setStatus(newStatus);

            // Set timestamps based on status
            if (AlertStatus.ARRIVED.equals(newStatus)) {
                alertResponder.setArrivalTime(java.time.LocalDateTime.now());
            }

            // Handle ETA if provided
            String etaStr = request.get("eta");
            if (etaStr != null && !etaStr.trim().isEmpty()) {
                alertResponder.setEta(etaStr.trim());
            }

            alertResponderRepository.save(alertResponder);

            // If status is RESOLVED, check if all responders are done and update alert
            if (AlertStatus.RESOLVED.equals(newStatus)) {
                Alert alert = alertOpt.get();
                // Count if any active responders remain
                long activeCount = alertResponderRepository.countAssignedByAlertId(alertId);
                // Active count after this resolved = current active - 1 (the one just resolved)
                // But we already saved with RESOLVED status, so countAssigned won't include
                // this
                // So if activeCount == 0, all responders have finished
                if (activeCount == 0) {
                    alert.setStatus(AlertStatus.FINISHED);
                    alert.setResolvedAt(java.time.LocalDateTime.now());
                    alertRepository.save(alert);
                }
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Status updated to " + newStatus.getValue(),
                    "newStatus", newStatus.getValue()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Unexpected error occurred"));
        }
    }

    // @PutMapping("/update-alert-status")
    // public ResponseEntity<Object> updateAlertStatus(
    // @RequestBody Map<String, String> request,
    // @RequestHeader("Authorization") String authHeader) {
    // try {
    // String token = authHeader.replace("Bearer ", "");
    // if (!jwtService.isTokenValid(token)) {
    // return
    // ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(createErrorResponse("Invalid
    // token"));
    // }

    // UUID responderId = jwtService.extractUserId(token);
    // UUID alertId = UUID.fromString(request.get("alertId"));
    // String newStatus = request.get("status");

    // if (newStatus == null || newStatus.trim().isEmpty()) {
    // return
    // ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Status
    // is required"));
    // }

    // // Validate status values
    // // if (!isValidAlertStatus(newStatus)) {
    // // return
    // ResponseEntity.status(HttpStatus.BAD_REQUEST).body(createErrorResponse("Invalid
    // status. Must be one of: ACCEPTED, EN_ROUTE, ARRIVED, RESOLVED"));
    // // }

    // // Find the AlertResponder record
    // Optional<AlertResponder> alertResponderOpt =
    // alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);

    // if (alertResponderOpt.isEmpty()) {
    // return
    // ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert
    // not found or not assigned to you"));
    // }

    // AlertResponder alertResponder = alertResponderOpt.get();
    // AlertStatus statusEnum = AlertStatus.fromString(newStatus);
    // alertResponder.setStatus(statusEnum);

    // // Set arrival time if status is "arrived"
    // if (AlertStatus.RESOLVED.equals(statusEnum)) {
    // alertResponder.setArrivalTime(java.time.LocalDateTime.now());
    // }

    // alertResponderRepository.save(alertResponder);

    // return ResponseEntity.ok(Map.of("success", true, "message", "Alert status
    // updated successfully"));
    // } catch (Exception e) {
    // return
    // ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(createErrorResponse("Unexpected
    // error occurred"));
    // }
    // }

    // private boolean isValidAlertStatus(String status) {
    // return AlertStatus.isValid(status) &&
    // (AlertStatus.ACCEPTED.getValue().equals(status) ||
    // AlertStatus.EN_ROUTE.getValue().equals(status) ||
    // AlertStatus.ARRIVED.getValue().equals(status) ||
    // AlertStatus.RESOLVED.getValue().equals(status));
    // }

    private Map<String, Object> createAlertResponderSummary(AlertResponder alertResponder) {
        Map<String, Object> data = new HashMap<>();
        data.put("alertId", alertResponder.getAlertId());
        data.put("responderId", alertResponder.getResponderId());
        data.put("status", alertResponder.getStatus().getValue());
        data.put("acceptedAt", alertResponder.getAcceptedAt());
        return data;
    }

    /**
     * Create alert responder data with full alert and user details
     * Includes severity information and forwarding details
     */
    private Map<String, Object> createAlertResponderWithFullDetails(AlertResponder alertResponder) {
        Map<String, Object> data = new HashMap<>();

        // Basic alert responder info
        data.put("alertId", alertResponder.getAlertId());
        data.put("responderId", alertResponder.getResponderId());
        data.put("responderStatus", alertResponder.getStatus().getValue());
        data.put("acceptedAt", alertResponder.getAcceptedAt());
        data.put("arrivalTime", alertResponder.getArrivalTime());
        data.put("eta", alertResponder.getEta());
        data.put("notes", alertResponder.getNotes());
        data.put("createdAt", alertResponder.getCreatedAt());

        // Include forwarding info if applicable
        if (alertResponder.isForwarded()) {
            data.put("forwarded", true);
            data.put("forwardedAt", alertResponder.getForwardedAt());
            if (alertResponder.getForwardedFromResponderId() != null) {
                Optional<User> forwarderOpt = userRepository.findById(alertResponder.getForwardedFromResponderId());
                if (forwarderOpt.isPresent()) {
                    data.put("forwardedFrom", forwarderOpt.get().getFullName());
                    data.put("forwardedFromId", alertResponder.getForwardedFromResponderId());
                }
            }
        } else {
            data.put("forwarded", false);
        }

        // Fetch and include full alert details
        Optional<Alert> alertOpt = alertRepository.findById(alertResponder.getAlertId());
        if (alertOpt.isPresent()) {
            Alert alert = alertOpt.get();
            data.put("alertStatus", alert.getStatus().getValue());
            data.put("latitude", alert.getLatitude());
            data.put("longitude", alert.getLongitude());
            data.put("address", alert.getAddress());
            data.put("alertMessage", alert.getAlertMessage());
            data.put("triggerMethod", alert.getTriggerMethod());
            data.put("triggeredAt", alert.getTriggeredAt());
            data.put("resolvedAt", alert.getResolvedAt());

            // Include severity information
            data.put("severity", alert.getSeverity() != null ? alert.getSeverity() : "MEDIUM");
            data.put("incidentType", alert.getIncidentType());

            // Fetch victim user details
            Optional<User> victimOpt = userRepository.findById(alert.getUserId());
            if (victimOpt.isPresent()) {
                User victim = victimOpt.get();
                Map<String, Object> victimInfo = new HashMap<>();
                victimInfo.put("userId", victim.getId());
                victimInfo.put("fullName", victim.getFullName());
                victimInfo.put("phone", victim.getPhone());
                victimInfo.put("profilePicture", victim.getProfilePicture());
                data.put("victim", victimInfo);
            }
        }

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
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(createErrorResponse("Authentication token is invalid or expired"));
            }

            Optional<User> userOpt = userRepository.findByEmail(jwtService.extractEmail(token));

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("User not found"));
            }

            User user = userOpt.get();
            if (!user.getRole().equals(User.Role.RESPONDER)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(createErrorResponse("Access denied. User is not a responder"));
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
                        List<TrustedContact> userContacts = contactsMap.getOrDefault(u.getId(),
                                Collections.emptyList());
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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Internal server error"));
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
                        if (alertResponder.getStatus() == AlertStatus.PENDING
                                || alertResponder.getStatus() == AlertStatus.REJECTED) {
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
                            alertData.put("resolvedAt",
                                    alert.getResolvedAt() != null ? alert.getResolvedAt().toString() : null);
                            alertData.put("canceledAt",
                                    alert.getCanceledAt() != null ? alert.getCanceledAt().toString() : null);

                            // Responder information
                            alertData.put("responderId", alertResponder.getResponderId().toString());
                            alertData.put("responderStatus", alertResponder.getStatus().getValue());
                            alertData.put("acceptedAt",
                                    alertResponder.getAcceptedAt() != null ? alertResponder.getAcceptedAt().toString()
                                            : null);
                            // Note: No rejectedAt field in AlertResponder entity
                            alertData.put("eta", alertResponder.getEta());
                            alertData.put("arrivalTime",
                                    alertResponder.getArrivalTime() != null ? alertResponder.getArrivalTime().toString()
                                            : null);

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
                        if (timeA == null && timeB == null)
                            return 0;
                        if (timeA == null)
                            return 1;
                        if (timeB == null)
                            return -1;
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
