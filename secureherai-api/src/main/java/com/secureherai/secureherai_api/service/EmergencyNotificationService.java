package com.secureherai.secureherai_api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secureherai.secureherai_api.dto.EmergencyAlertDTO;
import com.secureherai.secureherai_api.entity.*;
import com.secureherai.secureherai_api.entity.DeviceToken.TokenType;
import com.secureherai.secureherai_api.entity.NotificationJob.JobStatus;
import com.secureherai.secureherai_api.entity.NotificationJob.JobType;
import com.secureherai.secureherai_api.enums.AlertStatus;
import com.secureherai.secureherai_api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Service for handling emergency notifications through multiple channels:
 * - WebSocket (real-time when app is open)
 * - Expo Push Notifications (when app is backgrounded)
 * - SMS fallback (when user is offline)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationJobRepository jobRepository;
    private final NotificationQueueRepository queueRepository;
    private final AlertRepository alertRepository;
    private final ResponderRepository responderRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AlertResponderRepository alertResponderRepository;
    private final ObjectMapper objectMapper;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build();

    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    @Value("${expo.push.url:https://exp.host/--/api/v2/push/send}")
    private String expoPushUrl;

    // Escalation Configuration
    private static final int BATCH_1_RESPONDERS = 3; // Initial: 3 responders
    private static final int BATCH_2_RESPONDERS = 7; // Escalation 1: 7 more
    private static final int BATCH_3_RESPONDERS = 10; // Escalation 2: 10 more
    private static final int CRITICAL_TTL_MINUTES = 15; // Critical emergency: 15 min TTL
    private static final int STANDARD_TTL_MINUTES = 60; // Standard emergency: 60 min TTL

    /**
     * Send emergency alert to nearby responders with TTL-based escalation
     */
    @Transactional
    public void notifyNearbyResponders(Alert alert, User victim, boolean isCritical) {
        log.info("📢 Starting emergency notification for alert {} (critical: {})", alert.getId(), isCritical);

        // Find nearest available responders
        List<Responder> nearestResponders = findNearestResponders(
                alert.getLatitude(),
                alert.getLongitude(),
                BATCH_1_RESPONDERS + BATCH_2_RESPONDERS + BATCH_3_RESPONDERS,
                List.of());

        if (nearestResponders.isEmpty()) {
            log.warn("No available responders found for alert {}", alert.getId());
            return;
        }

        // Get first batch of responders
        List<Responder> batch1 = nearestResponders.subList(0, Math.min(BATCH_1_RESPONDERS, nearestResponders.size()));

        log.info("📋 Batch 1 responders ({} of {} total available):", batch1.size(), nearestResponders.size());
        for (Responder r : batch1) {
            log.info("   - Responder: {} (userId: {})", r.getUser().getFullName(), r.getUserId());
        }

        // Notify first batch immediately
        for (Responder responder : batch1) {
            notifyResponder(alert, victim, responder, 1);
        }

        // Schedule escalation jobs if we have more responders
        int ttlMinutes = isCritical ? CRITICAL_TTL_MINUTES : STANDARD_TTL_MINUTES;

        if (nearestResponders.size() > BATCH_1_RESPONDERS) {
            scheduleEscalation(alert.getId(), 2, BATCH_2_RESPONDERS, ttlMinutes);
        }

        if (nearestResponders.size() > BATCH_1_RESPONDERS + BATCH_2_RESPONDERS) {
            scheduleEscalation(alert.getId(), 3, BATCH_3_RESPONDERS, ttlMinutes * 2);
        }

        log.info("✅ Notified {} responders in batch 1, scheduled escalations", batch1.size());
    }

    /**
     * Notify a single responder through all available channels
     */
    @Transactional
    public void notifyResponder(Alert alert, User victim, Responder responder, int batchNumber) {
        UUID responderId = responder.getUserId();
        User responderUser = responder.getUser();

        EmergencyAlertDTO alertDTO = createAlertDTO(alert, victim);

        // 1. Send via WebSocket (real-time)
        sendWebSocketNotification(responderId, alertDTO);

        // 2. Send push notification
        sendPushNotification(responderId, alertDTO);

        // 3. Queue for SMS fallback if needed
        queueForSMSFallback(responderId, alert, victim, batchNumber);

        // 4. Create in-app notification record
        createInAppNotification(responderId, alert, victim, batchNumber);

        log.info("🔔 Notified responder {} via all channels", responderId);
    }

    /**
     * Send real-time notification via WebSocket to a SPECIFIC user
     * Uses convertAndSendToUser which routes to
     * /user/{userId}/queue/emergency-alerts
     */
    public void sendWebSocketNotification(UUID userId, EmergencyAlertDTO alertDTO) {
        try {
            String destination = "/queue/emergency-alerts";
            String userIdStr = userId.toString();

            log.info("📡 Sending WebSocket notification to specific user: {} for alert: {}",
                    userIdStr, alertDTO.getAlertId());

            messagingTemplate.convertAndSendToUser(
                    userIdStr,
                    destination,
                    alertDTO);

            log.info("✅ WebSocket notification sent to user {} (destination: /user/{}/queue/emergency-alerts)",
                    userIdStr, userIdStr);
        } catch (Exception e) {
            log.error("❌ Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Send push notification via Expo Push Service
     */
    public void sendPushNotification(UUID userId, EmergencyAlertDTO alertDTO) {
        List<DeviceToken> tokens = deviceTokenRepository.findActiveTokensByType(userId, TokenType.EXPO_PUSH);

        if (tokens.isEmpty()) {
            log.debug("No Expo push tokens found for user {}", userId);
            return;
        }

        for (DeviceToken token : tokens) {
            try {
                sendExpoPushNotification(token.getToken(), alertDTO);
                token.setLastUsedAt(LocalDateTime.now());
                deviceTokenRepository.save(token);
            } catch (Exception e) {
                log.error("Failed to send push notification to token {}: {}", token.getId(), e.getMessage());
                // Deactivate invalid tokens
                if (e.getMessage().contains("DeviceNotRegistered") || e.getMessage().contains("InvalidCredentials")) {
                    token.setIsActive(false);
                    deviceTokenRepository.save(token);
                }
            }
        }
    }

    /**
     * Send notification via Expo Push API
     */
    private void sendExpoPushNotification(String expoPushToken, EmergencyAlertDTO alertDTO) throws IOException {
        Map<String, Object> notification = new HashMap<>();
        notification.put("to", expoPushToken);
        notification.put("title", "🚨 EMERGENCY ALERT");
        notification.put("body", alertDTO.getMessage() != null ? alertDTO.getMessage() : "Someone nearby needs help!");
        notification.put("sound", "default");
        notification.put("priority", "high");
        notification.put("channelId", "emergency-alerts");
        notification.put("data", Map.of(
                "alertId", alertDTO.getAlertId().toString(),
                "type", "EMERGENCY_NEARBY",
                "latitude", alertDTO.getLatitude(),
                "longitude", alertDTO.getLongitude()));

        String json = objectMapper.writeValueAsString(notification);

        Request request = new Request.Builder()
                .url(expoPushUrl)
                .post(RequestBody.create(json, MediaType.parse("application/json")))
                .addHeader("Accept", "application/json")
                .addHeader("Accept-Encoding", "gzip, deflate")
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Expo push failed: " + response.code() + " - " + response.body().string());
            }
            log.debug("✅ Expo push sent successfully to {}", expoPushToken);
        }
    }

    /**
     * Queue notification for SMS fallback
     */
    @Transactional
    public void queueForSMSFallback(UUID userId, Alert alert, User victim, int batchNumber) {
        NotificationQueue queue = new NotificationQueue(
                userId,
                alert.getId(),
                "🚨 EMERGENCY ALERT",
                String.format("Emergency at %s. Someone needs help! Alert ID: %s",
                        alert.getAddress() != null ? alert.getAddress() : "nearby location",
                        alert.getId().toString().substring(0, 8)),
                100 // High priority
        );
        queue.setSmsFallbackEnabled(true);
        queue.setExpiresAt(LocalDateTime.now().plusHours(2));

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("alertId", alert.getId().toString());
            payload.put("batchNumber", batchNumber);
            payload.put("victimName", victim.getFullName());
            queue.setPayload(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            log.error("Failed to serialize payload: {}", e.getMessage());
        }

        queueRepository.save(queue);
        log.debug("📋 Queued notification for SMS fallback: user {}", userId);
    }

    /**
     * Send SMS via Twilio
     */
    public void sendSMS(String phoneNumber, String message) {
        if (twilioAccountSid == null || twilioAccountSid.isEmpty()) {
            log.warn("Twilio not configured, skipping SMS");
            return;
        }

        try {
            String url = String.format("https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json", twilioAccountSid);

            RequestBody formBody = new FormBody.Builder()
                    .add("To", phoneNumber)
                    .add("From", twilioPhoneNumber)
                    .add("Body", message)
                    .build();

            String credentials = Credentials.basic(twilioAccountSid, twilioAuthToken);

            Request request = new Request.Builder()
                    .url(url)
                    .post(formBody)
                    .addHeader("Authorization", credentials)
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful()) {
                    log.info("✅ SMS sent successfully to {}", phoneNumber);
                } else {
                    log.error("SMS failed: {} - {}", response.code(), response.body().string());
                }
            }
        } catch (Exception e) {
            log.error("Failed to send SMS: {}", e.getMessage());
        }
    }

    /**
     * Send SMS fallback for queued notification
     */
    @Transactional
    public void sendSMSFallback(NotificationQueue queued) {
        Optional<User> userOpt = userRepository.findById(queued.getUserId());
        if (userOpt.isEmpty() || userOpt.get().getPhone() == null) {
            log.warn("Cannot send SMS fallback - user {} has no phone number", queued.getUserId());
            return;
        }

        User user = userOpt.get();
        if (!user.getSmsAlerts()) {
            log.debug("User {} has SMS alerts disabled", user.getId());
            return;
        }

        sendSMS(user.getPhone(), queued.getMessage());

        queued.setSmsSent(true);
        queued.setSmsSentAt(LocalDateTime.now());
        queued.setStatus(NotificationQueue.QueueStatus.SMS_SENT);
        queueRepository.save(queued);
    }

    /**
     * Schedule an escalation job
     */
    @Transactional
    public void scheduleEscalation(UUID alertId, int batchNumber, int responderCount, int delayMinutes) {
        NotificationJob job = new NotificationJob(
                alertId,
                JobType.ESCALATE_NOTIFICATION,
                batchNumber,
                responderCount,
                LocalDateTime.now().plusMinutes(delayMinutes));
        jobRepository.save(job);
        log.info("📅 Scheduled escalation job for alert {} - batch {} in {} minutes",
                alertId, batchNumber, delayMinutes);
    }

    /**
     * Process escalation job - notify more responders
     */
    @Transactional
    public void escalateNotification(NotificationJob job) {
        Optional<Alert> alertOpt = alertRepository.findById(job.getAlertId());
        if (alertOpt.isEmpty()) {
            log.warn("Alert {} not found for escalation", job.getAlertId());
            return;
        }

        Alert alert = alertOpt.get();

        // Check if alert is still active
        if (alert.getStatus() != AlertStatus.ACTIVE) {
            log.info("Alert {} is no longer active, skipping escalation", alert.getId());
            job.setStatus(JobStatus.CANCELLED);
            return;
        }

        // Check if any responder has already accepted
        List<AlertResponder> acceptedResponders = alertResponderRepository.findAcceptedByAlertId(alert.getId());
        if (!acceptedResponders.isEmpty()) {
            log.info("Alert {} already accepted by responder, skipping escalation", alert.getId());
            job.setStatus(JobStatus.CANCELLED);
            return;
        }

        Optional<User> victimOpt = userRepository.findById(alert.getUserId());
        if (victimOpt.isEmpty()) {
            log.warn("Victim user {} not found for alert {}", alert.getUserId(), alert.getId());
            return;
        }

        // Find already notified responders
        List<AlertResponder> notifiedResponders = alertResponderRepository.findByAlertId(alert.getId());
        List<UUID> excludeIds = notifiedResponders.stream()
                .map(ar -> ar.getResponderId())
                .toList();

        // Find more responders
        List<Responder> moreResponders = findNearestResponders(
                alert.getLatitude(),
                alert.getLongitude(),
                job.getRespondersToNotify(),
                excludeIds);

        // Notify new batch
        for (Responder responder : moreResponders) {
            notifyResponder(alert, victimOpt.get(), responder, job.getBatchNumber());
        }

        log.info("🔔 Escalated alert {} to {} more responders (batch {})",
                alert.getId(), moreResponders.size(), job.getBatchNumber());
    }

    /**
     * Expire notification - mark as expired and notify user
     */
    @Transactional
    public void expireNotification(NotificationJob job) {
        // Implementation for notification expiration
        log.info("Expiring notifications for job {}", job.getId());
    }

    /**
     * Process SMS fallback job
     */
    @Transactional
    public void processSMSFallbackJob(NotificationJob job) {
        List<NotificationQueue> queued = queueRepository.findByUserIdAndStatus(
                job.getAlertId(), // Using alertId to find related queued notifications
                NotificationQueue.QueueStatus.QUEUED);

        for (NotificationQueue notification : queued) {
            sendSMSFallback(notification);
        }
    }

    /**
     * Send follow-up "Are you safe?" check
     */
    @Transactional
    public void sendFollowUpCheck(NotificationJob job) {
        Optional<Alert> alertOpt = alertRepository.findById(job.getAlertId());
        if (alertOpt.isEmpty())
            return;

        Alert alert = alertOpt.get();
        if (alert.getStatus() != AlertStatus.ACTIVE)
            return;

        Optional<User> userOpt = userRepository.findById(alert.getUserId());
        if (userOpt.isEmpty())
            return;

        // Send "Are you safe?" notification to the victim
        EmergencyAlertDTO followUp = new EmergencyAlertDTO();
        followUp.setAlertId(alert.getId());
        followUp.setType("ARE_YOU_SAFE");
        followUp.setMessage("Your emergency alert is still active. Are you safe?");

        sendWebSocketNotification(alert.getUserId(), followUp);
        sendPushNotification(alert.getUserId(), followUp);

        log.info("📤 Sent 'Are you safe?' follow-up for alert {}", alert.getId());
    }

    /**
     * Cancel all pending notifications for an alert (when resolved/cancelled)
     */
    @Transactional
    public void cancelPendingNotifications(UUID alertId) {
        jobRepository.cancelPendingJobsForAlert(alertId);
        queueRepository.cancelQueuedNotificationsForAlert(alertId);
        log.info("🚫 Cancelled all pending notifications for alert {}", alertId);
    }

    /**
     * Create in-app notification record
     */
    private void createInAppNotification(UUID responderId, Alert alert, User victim, int batchNumber) {
        Notification notification = new Notification();
        notification.setUserId(responderId);
        notification.setType(Notification.NotificationType.EMERGENCY_NEARBY);
        notification.setChannel(Notification.NotificationChannel.IN_APP);
        notification.setTitle("🚨 Emergency Alert");
        notification.setMessage(String.format("%s needs help nearby!", victim.getFullName()));
        notification.setPriority(100);
        notification.setStatus(Notification.NotificationStatus.SENT);
        notification.setSentAt(LocalDateTime.now());
        notification.setAlertId(alert.getId());
        notification.setBatchNumber(batchNumber);
        notification.setExpiresAt(LocalDateTime.now().plusHours(2));

        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", alert.getId().toString());
        payload.put("latitude", alert.getLatitude());
        payload.put("longitude", alert.getLongitude());
        payload.put("victimName", victim.getFullName());
        notification.setPayload(payload);

        notificationRepository.save(notification);
    }

    /**
     * Find nearest available responders using Haversine formula
     */
    private List<Responder> findNearestResponders(BigDecimal latitude, BigDecimal longitude,
            int limit, List<UUID> excludeIds) {
        // Get all available responders
        List<Responder> available = responderRepository.findByStatusAndIsActiveTrue(
                Responder.Status.AVAILABLE);

        // Filter out excluded responders
        if (excludeIds != null && !excludeIds.isEmpty()) {
            available = available.stream()
                    .filter(r -> !excludeIds.contains(r.getUserId()))
                    .toList();
        }

        // Filter responders with location and sort by distance
        return available.stream()
                .filter(r -> r.getUser() != null)
                .sorted((r1, r2) -> {
                    double dist1 = calculateDistance(latitude, longitude, r1);
                    double dist2 = calculateDistance(latitude, longitude, r2);
                    return Double.compare(dist1, dist2);
                })
                .limit(limit)
                .toList();
    }

    /**
     * Calculate distance using Haversine formula
     * Returns distance in kilometers between the alert location and responder's
     * current location
     */
    private double calculateDistance(BigDecimal alertLat, BigDecimal alertLon, Responder responder) {
        User user = responder.getUser();
        if (user == null || user.getCurrentLatitude() == null || user.getCurrentLongitude() == null) {
            // No location data - return large distance to deprioritize
            log.debug("Responder {} has no location data, assigning max distance", responder.getUserId());
            return Double.MAX_VALUE;
        }

        double lat1 = alertLat.doubleValue();
        double lon1 = alertLon.doubleValue();
        double lat2 = user.getCurrentLatitude().doubleValue();
        double lon2 = user.getCurrentLongitude().doubleValue();

        // Haversine formula
        final double R = 6371; // Earth's radius in kilometers
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;

        log.debug("Distance from alert to responder {}: {:.2f} km", responder.getUserId(), distance);
        return distance;
    }

    /**
     * Create DTO for alert
     */
    private EmergencyAlertDTO createAlertDTO(Alert alert, User victim) {
        EmergencyAlertDTO dto = new EmergencyAlertDTO();
        dto.setAlertId(alert.getId());
        dto.setType("EMERGENCY_NEARBY");
        dto.setLatitude(alert.getLatitude());
        dto.setLongitude(alert.getLongitude());
        dto.setAddress(alert.getAddress());
        dto.setMessage(alert.getAlertMessage());
        dto.setTriggeredAt(alert.getTriggeredAt());
        dto.setVictimName(victim.getFullName());
        dto.setVictimPhone(victim.getPhone());
        return dto;
    }

    // =====================
    // WebSocket Event Handlers
    // =====================

    /**
     * Handle alert acknowledgment from responder (they received the notification)
     */
    @Transactional
    public void handleAlertAcknowledgment(Long alertId, Long userId) {
        log.info("Alert {} acknowledged by user {}", alertId, userId);

        // Find the notification queue entry and mark as delivered
        UUID alertUuid = convertToUUID(alertId);
        List<NotificationQueue> queued = queueRepository.findByAlertIdAndStatus(
                alertUuid, NotificationQueue.QueueStatus.QUEUED);

        for (NotificationQueue entry : queued) {
            if (entry.getUserId().equals(userId)) {
                entry.setStatus(NotificationQueue.QueueStatus.DELIVERED);
                entry.setDeliveredAt(LocalDateTime.now());
                queueRepository.save(entry);
                log.debug("Marked notification queue entry {} as delivered", entry.getId());
                break;
            }
        }
    }

    /**
     * Handle alert response (accept/reject) from responder via WebSocket
     */
    @Transactional
    public void handleAlertResponse(Long alertId, Long userId, boolean accepted) {
        log.info("Alert {} {} by user {} via WebSocket", alertId, accepted ? "accepted" : "rejected", userId);

        UUID alertUuid = convertToUUID(alertId);
        UUID userUuid = convertToUUID(userId);

        Optional<Alert> alertOpt = alertRepository.findById(alertUuid);
        if (alertOpt.isEmpty()) {
            log.warn("Alert {} not found for response", alertId);
            return;
        }

        Alert alert = alertOpt.get();

        if (accepted) {
            // Update alert status
            if (alert.getStatus() == AlertStatus.ACTIVE) {
                alert.setStatus(AlertStatus.ACCEPTED);
                alertRepository.save(alert);
            }

            // Create or update AlertResponder entry
            Optional<AlertResponder> existing = alertResponderRepository.findByAlertIdAndResponderId(alertUuid,
                    userUuid);
            AlertResponder alertResponder;

            if (existing.isPresent()) {
                alertResponder = existing.get();
                alertResponder.setStatus(AlertStatus.ACCEPTED);
                alertResponder.setAcceptedAt(LocalDateTime.now());
            } else {
                alertResponder = new AlertResponder();
                alertResponder.setAlertId(alertUuid);
                alertResponder.setResponderId(userUuid);
                alertResponder.setStatus(AlertStatus.ACCEPTED);
                alertResponder.setAcceptedAt(LocalDateTime.now());
            }
            alertResponderRepository.save(alertResponder);

            // Cancel escalation jobs for this alert
            cancelEscalationJobs(alertUuid);

            // Notify victim that help is on the way
            notifyVictimOfResponse(alert, userUuid, true);

            // Notify other responders that alert is being handled
            broadcastAlertUpdate(alert, "ACCEPTED", userId);
        } else {
            // Mark as rejected
            Optional<AlertResponder> existing = alertResponderRepository.findByAlertIdAndResponderId(alertUuid,
                    userUuid);
            if (existing.isPresent()) {
                AlertResponder alertResponder = existing.get();
                alertResponder.setStatus(AlertStatus.REJECTED);
                alertResponderRepository.save(alertResponder);
            }
        }
    }

    /**
     * Handle location update from responder (sends to victim)
     */
    public void handleLocationUpdate(Long alertId, Long userId, double latitude, double longitude) {
        UUID alertUuid = convertToUUID(alertId);
        log.info("📍 Responder location update for alert {} from user {}: ({}, {})", alertId, userId, latitude,
                longitude);

        // Broadcast location to victim
        Map<String, Object> locationUpdate = new HashMap<>();
        locationUpdate.put("type", "RESPONDER_LOCATION");
        locationUpdate.put("alertId", alertId);
        locationUpdate.put("responderId", userId);
        locationUpdate.put("latitude", latitude);
        locationUpdate.put("longitude", longitude);
        locationUpdate.put("timestamp", LocalDateTime.now().toString());

        // Get victim ID and send location
        alertRepository.findById(alertUuid).ifPresent(alert -> {
            String destination = "/user/" + alert.getUserId() + "/queue/emergency-updates";
            messagingTemplate.convertAndSend(destination, locationUpdate);
            log.debug("📍 Sent responder location to victim {}", alert.getUserId());
        });
    }

    /**
     * Handle location update from victim (sends to all accepted responders)
     */
    public void handleVictimLocationUpdate(Long alertId, Long victimUserId, double latitude, double longitude) {
        UUID alertUuid = convertToUUID(alertId);
        log.info("📍 Victim location update for alert {} from user {}: ({}, {})", alertId, victimUserId, latitude,
                longitude);

        // Build location update message
        Map<String, Object> locationUpdate = new HashMap<>();
        locationUpdate.put("type", "VICTIM_LOCATION");
        locationUpdate.put("alertId", alertId);
        locationUpdate.put("victimId", victimUserId);
        locationUpdate.put("latitude", latitude);
        locationUpdate.put("longitude", longitude);
        locationUpdate.put("timestamp", LocalDateTime.now().toString());

        // Find all accepted responders for this alert and send them the victim's
        // location
        List<AlertResponder> acceptedResponders = alertResponderRepository.findAcceptedByAlertId(alertUuid);

        for (AlertResponder ar : acceptedResponders) {
            String destination = "/user/" + ar.getResponderId() + "/queue/emergency-updates";
            messagingTemplate.convertAndSend(destination, locationUpdate);
            log.debug("📍 Sent victim location to responder {}", ar.getResponderId());
        }

        log.info("📍 Sent victim location to {} accepted responders", acceptedResponders.size());
    }

    /**
     * Notify victim that a responder has accepted
     */
    private void notifyVictimOfResponse(Alert alert, UUID responderId, boolean accepted) {
        userRepository.findById(responderId).ifPresent(responder -> {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "RESPONDER_UPDATE");
            message.put("alertId", alert.getId().toString());
            message.put("responderName", responder.getFullName());
            message.put("accepted", accepted);
            message.put("timestamp", LocalDateTime.now().toString());

            String destination = "/user/" + alert.getUserId() + "/queue/emergency-updates";
            messagingTemplate.convertAndSend(destination, message);

            log.info("Notified victim {} that responder {} has accepted", alert.getUserId(), responderId);
        });
    }

    /**
     * Broadcast alert status update to all subscribed responders
     */
    private void broadcastAlertUpdate(Alert alert, String status, Long acceptedBy) {
        Map<String, Object> update = new HashMap<>();
        update.put("type", "ALERT_UPDATE");
        update.put("alertId", alert.getId().toString());
        update.put("status", status);
        update.put("acceptedBy", acceptedBy);
        update.put("timestamp", LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/alerts/" + alert.getId(), update);
    }

    /**
     * Cancel escalation jobs when alert is accepted
     */
    private void cancelEscalationJobs(UUID alertId) {
        List<NotificationJob> pendingJobs = jobRepository.findByAlertIdAndStatusIn(
                alertId, List.of(JobStatus.PENDING, JobStatus.PROCESSING));

        for (NotificationJob job : pendingJobs) {
            job.setStatus(JobStatus.CANCELLED);
            job.setExecutedAt(LocalDateTime.now());
            jobRepository.save(job);
            log.debug("Cancelled escalation job {} for alert {}", job.getId(), alertId);
        }
    }

    /**
     * Convert Long to UUID (for backwards compatibility)
     */
    private UUID convertToUUID(Long id) {
        // Create a deterministic UUID from Long ID
        return new UUID(0L, id);
    }
}
