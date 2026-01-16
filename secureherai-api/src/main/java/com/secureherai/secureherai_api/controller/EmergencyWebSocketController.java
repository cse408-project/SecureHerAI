package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.websocket.WebSocketPrincipal;
import com.secureherai.secureherai_api.service.EmergencyNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket controller for handling real-time emergency alert interactions
 */
@Controller
public class EmergencyWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(EmergencyWebSocketController.class);

    private final EmergencyNotificationService notificationService;

    public EmergencyWebSocketController(EmergencyNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Handle alert acknowledgment from responder
     * Client sends to: /app/emergency/acknowledge
     */
    @MessageMapping("/emergency/acknowledge")
    public void acknowledgeAlert(@Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        try {
            Long alertId = extractLong(payload.get("alertId"));
            Long userId = getUserId(principal, headerAccessor);

            if (alertId == null || userId == null) {
                logger.warn("Invalid acknowledge request: alertId={}, userId={}", alertId, userId);
                return;
            }

            logger.info("Alert {} acknowledged by user {}", alertId, userId);
            notificationService.handleAlertAcknowledgment(alertId, userId);

        } catch (Exception e) {
            logger.error("Error processing alert acknowledgment", e);
        }
    }

    /**
     * Handle alert response (accept/reject) from responder
     * Client sends to: /app/emergency/respond
     */
    @MessageMapping("/emergency/respond")
    public void respondToAlert(@Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        try {
            Long alertId = extractLong(payload.get("alertId"));
            Long userId = getUserId(principal, headerAccessor);
            Boolean accepted = (Boolean) payload.get("accepted");

            if (alertId == null || userId == null || accepted == null) {
                logger.warn("Invalid respond request: alertId={}, userId={}, accepted={}",
                        alertId, userId, accepted);
                return;
            }

            logger.info("Alert {} {} by user {}", alertId, accepted ? "accepted" : "rejected", userId);
            notificationService.handleAlertResponse(alertId, userId, accepted);

        } catch (Exception e) {
            logger.error("Error processing alert response", e);
        }
    }

    /**
     * Handle location update from responder (sends to victim)
     * Client sends to: /app/emergency/location
     */
    @MessageMapping("/emergency/location")
    public void updateLocation(@Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        try {
            Long alertId = extractLong(payload.get("alertId"));
            Long userId = getUserId(principal, headerAccessor);
            Double latitude = extractDouble(payload.get("latitude"));
            Double longitude = extractDouble(payload.get("longitude"));

            if (alertId == null || userId == null || latitude == null || longitude == null) {
                logger.warn("Invalid location update: alertId={}, userId={}, lat={}, lng={}",
                        alertId, userId, latitude, longitude);
                return;
            }

            logger.debug("Responder location update for alert {} from user {}: ({}, {})",
                    alertId, userId, latitude, longitude);
            notificationService.handleLocationUpdate(alertId, userId, latitude, longitude);

        } catch (Exception e) {
            logger.error("Error processing location update", e);
        }
    }

    /**
     * Handle location update from victim (sends to accepted responders)
     * Client sends to: /app/emergency/victim-location
     */
    @MessageMapping("/emergency/victim-location")
    public void updateVictimLocation(@Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor,
            Principal principal) {
        try {
            Long alertId = extractLong(payload.get("alertId"));
            Long userId = getUserId(principal, headerAccessor);
            Double latitude = extractDouble(payload.get("latitude"));
            Double longitude = extractDouble(payload.get("longitude"));

            if (alertId == null || userId == null || latitude == null || longitude == null) {
                logger.warn("Invalid victim location update: alertId={}, userId={}, lat={}, lng={}",
                        alertId, userId, latitude, longitude);
                return;
            }

            logger.debug("Victim location update for alert {} from user {}: ({}, {})",
                    alertId, userId, latitude, longitude);
            notificationService.handleVictimLocationUpdate(alertId, userId, latitude, longitude);

        } catch (Exception e) {
            logger.error("Error processing victim location update", e);
        }
    }

    /**
     * Extract user ID from principal or session attributes
     */
    private Long getUserId(Principal principal, SimpMessageHeaderAccessor headerAccessor) {
        if (principal instanceof WebSocketPrincipal) {
            return ((WebSocketPrincipal) principal).getUserId();
        }

        // Fallback to session attributes
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object userId = sessionAttributes.get("userId");
            return extractLong(userId);
        }

        return null;
    }

    /**
     * Safely extract Long from various types
     */
    private Long extractLong(Object value) {
        if (value == null)
            return null;
        if (value instanceof Long)
            return (Long) value;
        if (value instanceof Integer)
            return ((Integer) value).longValue();
        if (value instanceof String) {
            try {
                return Long.parseLong((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * Safely extract Double from various types
     */
    private Double extractDouble(Object value) {
        if (value == null)
            return null;
        if (value instanceof Double)
            return (Double) value;
        if (value instanceof Float)
            return ((Float) value).doubleValue();
        if (value instanceof Integer)
            return ((Integer) value).doubleValue();
        if (value instanceof Long)
            return ((Long) value).doubleValue();
        if (value instanceof String) {
            try {
                return Double.parseDouble((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
