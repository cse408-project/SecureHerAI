package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.EmergencyAlertDTO;
import com.secureherai.secureherai_api.dto.notification.NotificationCreateDto;
import com.secureherai.secureherai_api.dto.notification.NotificationResponseDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.DeviceToken;
import com.secureherai.secureherai_api.entity.DeviceToken.TokenType;
import com.secureherai.secureherai_api.entity.Notification;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.enums.AlertStatus;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.DeviceTokenRepository;
import com.secureherai.secureherai_api.repository.NotificationRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.repository.TrustedContactRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Service for handling notification operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TrustedContactRepository trustedContactRepository;
    private final ResponderRepository responderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AlertResponderRepository alertResponderRepository;
    private final AlertRepository alertRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @Value("${expo.push.url:https://exp.host/--/api/v2/push/send}")
    private String expoPushUrl;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
            .build();

    // TTL Configuration
    // TODO: BATCH_SIZE = 2 & MAX_RESPONDERS = 10 $ EMERGENCY_TTL = 1 hour for
    // production
    private static final Duration EMERGENCY_TTL = Duration.ofMinutes(10); // 10 minutes TTL for testing (production: 1
                                                                          // hour)
    private static final int BATCH_SIZE = 1; // Send to 1 responder at a time (for testing, production: 2)
    private static final int MAX_RESPONDERS = 2; // Maximum responders to notify per alert (for testing, production: 10)

    /**
     * Create a new notification
     */
    @Transactional
    public NotificationResponseDto createNotification(NotificationCreateDto createDto) {
        log.info("Creating notification for user: {}, type: {}", createDto.getUserId(), createDto.getType());

        // Verify user exists before creating notification to avoid FK constraint
        // violation
        if (!userRepository.existsById(createDto.getUserId())) {
            log.warn("Cannot create notification: user {} not found", createDto.getUserId());
            return null;
        }

        Notification notification = new Notification();
        notification.setUserId(createDto.getUserId());
        notification.setType(createDto.getType());
        notification.setChannel(createDto.getChannel());
        notification.setTitle(createDto.getTitle());
        notification.setMessage(createDto.getMessage());
        notification.setPayload(createDto.getPayload());
        notification.setPriority(createDto.getPriority());

        Notification saved = notificationRepository.save(notification);

        // Send notification asynchronously if needed
        sendNotificationAsync(saved);

        return NotificationResponseDto.fromEntity(saved);
    }

    /**
     * Send SOS alert notifications to trusted contacts and nearby responders
     */
    @Transactional
    public void sendSOSAlertNotifications(Alert alert) {
        log.info("Sending SOS alert notifications for alert: {}", alert.getId());

        // Send to trusted contacts
        sendTrustedContactNotifications(alert);

        // Send to nearest active responders
        sendNearbyResponderNotifications(alert);
    }

    /**
     * Send notifications to trusted contacts
     */
    private void sendTrustedContactNotifications(Alert alert) {
        List<TrustedContact> trustedContacts = trustedContactRepository.findByUserId(alert.getUserId());

        for (TrustedContact contact : trustedContacts) {
            // Send email directly to trusted contact if email is available
            // Trusted contacts are external people, not app users, so we don't create
            // in-app notifications
            if (contact.getEmail() != null && !contact.getEmail().isEmpty()) {
                sendEmergencyEmailToContact(contact, alert);
            }

            // Note: SMS to trusted contacts is handled via EmergencyNotificationService
            // with Twilio integration
            // This service focuses on email notifications for trusted contacts

            log.info("Emergency notification sent to trusted contact: {} ({})", contact.getName(), contact.getPhone());
        }
    }

    /**
     * Send notifications to nearby active responders with TTL and 10-responder
     * limit
     */
    private void sendNearbyResponderNotifications(Alert alert) {
        // Get all active responders
        List<Responder> activeResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.AVAILABLE);

        if (activeResponders.isEmpty()) {
            log.warn("No active responders available for alert: {}", alert.getId());
            return;
        }

        // Calculate distance and sort by nearest
        List<ResponderWithDistance> sortedResponders = activeResponders.stream()
                .map(responder -> new ResponderWithDistance(responder,
                        calculateDistance(alert.getLatitude(), alert.getLongitude(),
                                responder.getUser().getCurrentLatitude(), responder.getUser().getCurrentLongitude()))) // Get
                                                                                                                       // location
                                                                                                                       // from
                                                                                                                       // User
                                                                                                                       // entity
                .sorted(Comparator.comparingDouble(ResponderWithDistance::getDistance))
                .limit(MAX_RESPONDERS) // Limit to maximum 10 responders
                .collect(Collectors.toList());

        if (sortedResponders.isEmpty()) {
            log.warn("No responders found within range for alert: {}", alert.getId());
            return;
        }

        log.info("Found {} responders for alert: {}, starting TTL batch process",
                sortedResponders.size(), alert.getId());

        // Send to first batch (nearest 2 responders)
        sendEmergencyBatch(alert, sortedResponders, 1);
    }

    /**
     * Send emergency response accepted notification
     */
    @Transactional
    public void sendEmergencyAcceptedNotification(UUID alertUserId, UUID responderId, String responderName) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("responderId", responderId);
        payload.put("responderName", responderName);
        payload.put("acceptedAt", LocalDateTime.now());

        String title = "✅ Emergency Response Accepted";
        String message = String.format("Your emergency alert has been accepted by %s. Help is on the way!",
                responderName);

        NotificationCreateDto notificationDto = new NotificationCreateDto(
                alertUserId,
                Notification.NotificationType.EMERGENCY_ACCEPTED,
                Notification.NotificationChannel.IN_APP,
                title,
                message,
                payload,
                8 // High priority
        );

        createNotification(notificationDto);
    }

    /**
     * Send "Are you safe?" follow-up notification
     */
    @Transactional
    public void sendAreYouSafeNotification(UUID userId, UUID alertId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", alertId);
        payload.put("followUpType", "safety_check");

        String title = "🔍 Safety Check";
        String message = "Are you safe? Your emergency alert is still active. Please respond to confirm your status.";

        NotificationCreateDto notificationDto = new NotificationCreateDto(
                userId,
                Notification.NotificationType.ARE_YOU_SAFE,
                Notification.NotificationChannel.BOTH,
                title,
                message,
                payload,
                12 // Very high priority
        );

        createNotification(notificationDto);
    }

    /**
     * Get notifications for a user
     */
    public List<NotificationResponseDto> getUserNotifications(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(NotificationResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get notifications for a user with pagination
     */
    public Page<NotificationResponseDto> getUserNotifications(UUID userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(NotificationResponseDto::fromEntity);
    }

    /**
     * Get unread notifications for a user
     */
    public List<NotificationResponseDto> getUnreadNotifications(UUID userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                userId, Notification.NotificationStatus.PENDING);
        return notifications.stream()
                .map(NotificationResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public boolean markNotificationAsRead(Long notificationId, UUID userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId,
                Notification.NotificationStatus.READ, LocalDateTime.now());
        return updated > 0;
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public int markAllNotificationsAsRead(UUID userId) {
        return notificationRepository.markAllAsRead(userId,
                Notification.NotificationStatus.PENDING,
                Notification.NotificationStatus.READ,
                LocalDateTime.now());
    }

    /**
     * Count unread notifications for a user
     */
    public long countUnreadNotifications(UUID userId) {
        return notificationRepository.countByUserIdAndStatus(userId, Notification.NotificationStatus.PENDING);
    }

    /**
     * Get all notifications for a specific alert (both in-app and email
     * notifications)
     */
    public Map<String, Object> getAllNotificationsForAlert(UUID alertId, UUID requestingUserId) {
        try {
            log.info("Getting all notifications for alert: {} requested by user: {}", alertId, requestingUserId);

            // Get in-app notifications from database
            List<Notification> inAppNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
                    alertId, Notification.NotificationType.EMERGENCY_NEARBY, Notification.NotificationStatus.SENT);

            // Also get pending/failed notifications
            List<Notification> pendingNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
                    alertId, Notification.NotificationType.EMERGENCY_NEARBY, Notification.NotificationStatus.PENDING);

            List<Notification> failedNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
                    alertId, Notification.NotificationType.EMERGENCY_NEARBY, Notification.NotificationStatus.FAILED);

            // Combine all in-app notifications
            List<Notification> allInAppNotifications = new ArrayList<>();
            allInAppNotifications.addAll(inAppNotifications);
            allInAppNotifications.addAll(pendingNotifications);
            allInAppNotifications.addAll(failedNotifications);

            // Convert to response DTOs
            List<NotificationResponseDto> inAppNotificationDtos = allInAppNotifications.stream()
                    .map(NotificationResponseDto::fromEntity)
                    .sorted(Comparator.comparing(NotificationResponseDto::getCreatedAt))
                    .collect(Collectors.toList());

            // Get trusted contacts that would have been notified
            // We need to find the user who triggered the alert from the first notification
            UUID alertUserId = null;
            if (!allInAppNotifications.isEmpty()) {
                // Get alert user ID from the alert payload or find the user who created the
                // alert
                Map<String, Object> payload = allInAppNotifications.get(0).getPayload();
                if (payload != null && payload.containsKey("alertUserId")) {
                    alertUserId = UUID.fromString(payload.get("alertUserId").toString());
                } else {
                    // Try to find the alert and get the user who created it
                    // For now, we'll use the requesting user as a fallback
                    alertUserId = requestingUserId;
                }
            } else {
                alertUserId = requestingUserId;
            }

            List<TrustedContact> trustedContacts = trustedContactRepository.findByUserId(alertUserId);

            // Create email notification information
            List<Map<String, Object>> emailNotifications = new ArrayList<>();
            for (TrustedContact contact : trustedContacts) {
                Map<String, Object> emailNotification = new HashMap<>();
                emailNotification.put("contactId", contact.getId());
                emailNotification.put("contactName", contact.getName());
                emailNotification.put("contactPhone", contact.getPhone());
                emailNotification.put("contactEmail", contact.getEmail());
                emailNotification.put("relationship", contact.getRelationship());
                emailNotification.put("type", "EMERGENCY_TRUSTED_CONTACT");
                emailNotification.put("channel", contact.getEmail() != null ? "EMAIL" : "PHONE_ONLY");
                emailNotification.put("status", contact.getEmail() != null ? "EMAIL_SENT" : "NO_EMAIL_ADDRESS");
                emailNotification.put("title", "🚨 Emergency Alert - Immediate Attention Required");
                emailNotification.put("message", String.format(
                        "Emergency alert from %s. Please contact them immediately at %s or go to their location.",
                        contact.getName(), contact.getPhone()));

                // Add timing information if available from logs
                emailNotification.put("sentAt",
                        inAppNotifications.isEmpty() ? null : inAppNotifications.get(0).getCreatedAt());

                emailNotifications.add(emailNotification);
            }

            // Create summary statistics
            Map<String, Object> summary = new HashMap<>();
            summary.put("alertId", alertId);
            summary.put("totalNotifications", inAppNotificationDtos.size() + emailNotifications.size());
            summary.put("inAppNotifications", inAppNotificationDtos.size());
            summary.put("emailNotifications", emailNotifications.size());
            summary.put("trustedContacts", trustedContacts.size());
            summary.put("respondersNotified", inAppNotificationDtos.size());
            summary.put("emailsSent", emailNotifications.stream()
                    .mapToInt(email -> "EMAIL_SENT".equals(email.get("status")) ? 1 : 0).sum());

            // Count by status
            Map<String, Long> statusCounts = allInAppNotifications.stream()
                    .collect(Collectors.groupingBy(
                            n -> n.getStatus().toString(),
                            Collectors.counting()));
            summary.put("statusCounts", statusCounts);

            // Count by batch if available
            Map<Integer, Long> batchCounts = allInAppNotifications.stream()
                    .filter(n -> n.getBatchNumber() != null)
                    .collect(Collectors.groupingBy(
                            Notification::getBatchNumber,
                            Collectors.counting()));
            summary.put("batchCounts", batchCounts);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "All notifications for alert retrieved successfully");
            response.put("alertId", alertId);
            response.put("summary", summary);
            response.put("inAppNotifications", inAppNotificationDtos);
            response.put("emailNotifications", emailNotifications);

            log.info("Retrieved {} in-app notifications and {} email notifications for alert: {}",
                    inAppNotificationDtos.size(), emailNotifications.size(), alertId);

            return response;

        } catch (Exception e) {
            log.error("Error getting notifications for alert: {}", alertId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to get notifications for alert: " + e.getMessage());
            errorResponse.put("alertId", alertId);
            return errorResponse;
        }
    }

    /**
     * Send emergency notifications to a batch of responders with TTL
     * Also creates AlertResponder records with PENDING status for proper tracking
     */
    @Transactional
    public void sendEmergencyBatch(Alert alert, List<ResponderWithDistance> allResponders, int batchNumber) {
        // Check if we've already notified the maximum number of responders
        long totalNotified = notificationRepository.countRespondersNotifiedForAlert(
                alert.getId(), Notification.NotificationType.EMERGENCY_NEARBY);

        if (totalNotified >= MAX_RESPONDERS) {
            log.warn("Maximum responders ({}) already notified for alert: {}", MAX_RESPONDERS, alert.getId());
            return;
        }

        int startIndex = (batchNumber - 1) * BATCH_SIZE;
        int endIndex = Math.min(startIndex + BATCH_SIZE, allResponders.size());

        if (startIndex >= allResponders.size()) {
            log.warn("No more responders available for alert: {} (reached end of list)", alert.getId());
            return;
        }

        List<ResponderWithDistance> batchResponders = allResponders.subList(startIndex, endIndex);

        log.info("Sending emergency batch {} to {} responders for alert: {}",
                batchNumber, batchResponders.size(), alert.getId());

        for (ResponderWithDistance responderWithDistance : batchResponders) {
            Responder responder = responderWithDistance.getResponder();

            // Create AlertResponder record with PENDING status (if not already exists)
            // This is crucial for tracking which responders have been notified
            if (!alertResponderRepository.existsByAlertIdAndResponderId(alert.getId(), responder.getUserId())) {
                AlertResponder alertResponder = new AlertResponder(
                        alert.getId(),
                        responder.getUserId(),
                        AlertStatus.PENDING);
                alertResponder.setNotes("batch_" + batchNumber); // Track which batch this responder was notified in
                alertResponderRepository.save(alertResponder);
                log.info("Created PENDING AlertResponder record for responder: {} alert: {} batch: {}",
                        responder.getUserId(), alert.getId(), batchNumber);
            }

            // Create notification payload
            Map<String, Object> payload = createAlertPayload(alert);
            payload.put("distance", responderWithDistance.getDistance());
            payload.put("responderType", responder.getResponderType());
            payload.put("batchNumber", batchNumber);
            payload.put("expiresAt", LocalDateTime.now().plus(EMERGENCY_TTL));

            String title = "🚨 Emergency Alert - Immediate Response Needed";
            String message = String.format(
                    "Emergency alert %.2fkm away. Location: %s. " +
                            "Please respond within 1 hour if available. Batch %d.",
                    responderWithDistance.getDistance(),
                    alert.getAddress() != null ? alert.getAddress() : "Location not available",
                    batchNumber);

            // Create and save notification with TTL
            createNotificationWithTTL(
                    responder.getUserId(),
                    Notification.NotificationType.EMERGENCY_NEARBY,
                    Notification.NotificationChannel.IN_APP,
                    title,
                    message,
                    payload,
                    15, // High priority for emergency
                    alert.getId(),
                    batchNumber);

            log.info("Emergency notification sent to responder: {} for alert: {}",
                    responder.getUserId(), alert.getId());
        }

        // Schedule expiration check for this batch
        scheduleExpirationCheck(alert, allResponders, batchNumber);
    }

    /**
     * Create notification with TTL and batch tracking
     */
    private Notification createNotificationWithTTL(UUID userId, Notification.NotificationType type,
            Notification.NotificationChannel channel, String title, String message,
            Map<String, Object> payload, Integer priority, UUID alertId, Integer batchNumber) {

        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setChannel(channel);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setPayload(payload);
        notification.setPriority(priority);
        notification.setAlertId(alertId);
        notification.setBatchNumber(batchNumber);
        notification.setTTL(EMERGENCY_TTL); // Set 1 hour TTL
        notification.setStatus(Notification.NotificationStatus.PENDING);

        notification = notificationRepository.save(notification);

        // Send the notification asynchronously
        sendNotificationAsync(notification);

        return notification;
    }

    /**
     * Schedule expiration check for emergency notifications
     */
    public void scheduleExpirationCheck(Alert alert, List<ResponderWithDistance> allResponders, int batchNumber) {
        CompletableFuture.runAsync(() -> {
            try {
                // Wait for TTL duration
                Thread.sleep(EMERGENCY_TTL.toMillis());

                // Check if any responder from this batch accepted
                List<Notification> batchNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
                        alert.getId(),
                        Notification.NotificationType.EMERGENCY_NEARBY,
                        Notification.NotificationStatus.PENDING);

                boolean batchExpired = batchNotifications.stream()
                        .filter(n -> n.getBatchNumber() != null && n.getBatchNumber().equals(batchNumber))
                        .allMatch(Notification::isExpired);

                if (batchExpired) {
                    log.info("Batch {} expired for alert {}, checking if need to send next batch",
                            batchNumber, alert.getId());

                    // Mark expired notifications as failed
                    batchNotifications.stream()
                            .filter(n -> n.getBatchNumber() != null && n.getBatchNumber().equals(batchNumber))
                            .filter(Notification::isExpired)
                            .forEach(n -> {
                                n.setStatus(Notification.NotificationStatus.FAILED);
                                notificationRepository.save(n);
                            });

                    // Check if alert is still active (not resolved)
                    long totalNotified = notificationRepository.countRespondersNotifiedForAlert(
                            alert.getId(), Notification.NotificationType.EMERGENCY_NEARBY);

                    if (totalNotified < MAX_RESPONDERS && !isAlertResolved(alert.getId())) {
                        // Send to next batch
                        sendEmergencyBatch(alert, allResponders, batchNumber + 1);
                    } else {
                        log.info("Alert {} - max responders reached or alert resolved, stopping TTL process",
                                alert.getId());
                    }
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Expiration check interrupted for alert: {}", alert.getId());
            }
        });
    }

    /**
     * Handle responder acceptance (stops TTL for this alert)
     */
    @Transactional
    public void handleResponderAcceptance(UUID alertId, UUID responderId) {
        // Create AlertResponder record to track the acceptance
        AlertResponder alertResponder = new AlertResponder();
        alertResponder.setAlertId(alertId);
        alertResponder.setResponderId(responderId);
        alertResponder.setStatus(AlertStatus.ACCEPTED);
        alertResponderRepository.save(alertResponder);

        // Mark all pending notifications for this alert as no longer needed
        List<Notification> pendingNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
                alertId,
                Notification.NotificationType.EMERGENCY_NEARBY,
                Notification.NotificationStatus.PENDING);

        pendingNotifications.forEach(notification -> {
            if (!notification.getUserId().equals(responderId)) {
                notification.setStatus(Notification.NotificationStatus.READ); // Cancel other invitations
                notificationRepository.save(notification);
            }
        });

        log.info(
                "Responder {} accepted alert {}, created AlertResponder record, cancelled {} other pending invitations",
                responderId, alertId, pendingNotifications.size() - 1);
    }

    /**
     * Check if alert is resolved based on the alert's status
     * Alert statuses: ACTIVE, FINISHED, DELETED, EXPIRED
     * Only ACTIVE alerts should receive notifications
     */
    private boolean isAlertResolved(UUID alertId) {
        return alertRepository.findById(alertId)
                .map(alert -> {
                    AlertStatus status = alert.getStatus();
                    // Alert is "resolved" (no more notifications) if status is not ACTIVE
                    return status != AlertStatus.ACTIVE;
                })
                .orElse(true); // If alert not found, treat as resolved (don't send notifications)
    }

    /**
     * Send notification asynchronously
     */
    private void sendNotificationAsync(Notification notification) {
        try {
            if (notification.getChannel() == Notification.NotificationChannel.EMAIL ||
                    notification.getChannel() == Notification.NotificationChannel.BOTH) {

                // Get user's email address
                userRepository.findById(notification.getUserId()).ifPresent(user -> {
                    try {
                        emailService.sendNotificationEmail(
                                user.getEmail(),
                                notification.getTitle(),
                                notification.getTitle(),
                                notification.getMessage());
                        log.info("Email notification sent for notification: {}", notification.getId());
                    } catch (Exception e) {
                        log.error("Failed to send email for notification: {}", notification.getId(), e);
                    }
                });
            }

            // Send push notifications for IN_APP or BOTH channels
            if (notification.getChannel() == Notification.NotificationChannel.IN_APP ||
                    notification.getChannel() == Notification.NotificationChannel.BOTH) {

                // In-app notifications are saved to database (already done by
                // createNotification)
                // But we can also send real-time push notifications to user's devices

                sendPushNotificationToUser(notification);
            }

            // Mark as sent
            notification.markAsSent();
            notificationRepository.save(notification);

        } catch (Exception e) {
            log.error("Failed to send notification: {}", notification.getId(), e);
            notification.markAsFailed();
            notificationRepository.save(notification);
        }
    }

    /**
     * Send emergency email to trusted contact
     */
    private void sendEmergencyEmailToContact(TrustedContact contact, Alert alert) {
        try {
            // Use the EmailService to send the emergency alert email
            emailService.sendEmergencyAlertEmail(
                    contact.getEmail(),
                    contact.getName(),
                    contact.getPhone(),
                    alert.getAlertMessage() != null ? alert.getAlertMessage() : "Emergency assistance needed",
                    alert.getAddress() != null ? alert.getAddress() : "Location not available",
                    alert.getTriggeredAt().toString());

            log.info("Emergency email sent to trusted contact: {} ({})", contact.getName(), contact.getEmail());

        } catch (Exception e) {
            log.error("Failed to send emergency email to trusted contact: {} ({})", contact.getName(),
                    contact.getEmail(), e);
        }
    }

    /**
     * Create alert payload for notifications
     */
    private Map<String, Object> createAlertPayload(Alert alert) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", alert.getId());
        payload.put("latitude", alert.getLatitude());
        payload.put("longitude", alert.getLongitude());
        payload.put("address", alert.getAddress());
        payload.put("triggerMethod", alert.getTriggerMethod());
        payload.put("alertMessage", alert.getAlertMessage());
        payload.put("audioRecording", alert.getAudioRecording());
        payload.put("triggeredAt", alert.getTriggeredAt());
        return payload;
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private double calculateDistance(BigDecimal lat1, BigDecimal lon1, BigDecimal lat2, BigDecimal lon2) {
        if (lat2 == null || lon2 == null) {
            return Double.MAX_VALUE; // Responder location not available
        }

        final int R = 6371; // Radius of the earth in km

        double latDistance = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double lonDistance = Math.toRadians(lon2.doubleValue() - lon1.doubleValue());
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1.doubleValue())) * Math.cos(Math.toRadians(lat2.doubleValue()))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c; // Distance in km

        return distance;
    }

    /**
     * Helper class for responder with distance calculation
     */
    private static class ResponderWithDistance {
        private final Responder responder;
        private final double distance;

        public ResponderWithDistance(Responder responder, double distance) {
            this.responder = responder;
            this.distance = distance;
        }

        public Responder getResponder() {
            return responder;
        }

        public double getDistance() {
            return distance;
        }
    }

    /**
     * Send push notification to user's devices via Expo Push Service
     * Uses the same infrastructure as EmergencyNotificationService
     */
    private void sendPushNotificationToUser(Notification notification) {
        try {
            // Get user's Expo push tokens from database
            List<DeviceToken> tokens = deviceTokenRepository.findActiveTokensByType(
                    notification.getUserId(), TokenType.EXPO_PUSH);

            if (tokens.isEmpty()) {
                log.debug("No Expo push tokens found for user {}", notification.getUserId());
                return;
            }

            for (DeviceToken token : tokens) {
                try {
                    sendExpoPushNotification(
                            token.getToken(),
                            notification.getTitle(),
                            notification.getMessage(),
                            notification.getPayload());
                    token.setLastUsedAt(LocalDateTime.now());
                    deviceTokenRepository.save(token);
                    log.debug("✅ Push notification sent to token {}", token.getId());
                } catch (Exception e) {
                    log.error("Failed to send push notification to token {}: {}", token.getId(), e.getMessage());
                    // Deactivate invalid tokens
                    if (e.getMessage() != null && (e.getMessage().contains("DeviceNotRegistered") ||
                            e.getMessage().contains("InvalidCredentials"))) {
                        token.setIsActive(false);
                        deviceTokenRepository.save(token);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to send push notification for notification: {}", notification.getId(), e);
        }
    }

    /**
     * Send notification via Expo Push API
     */
    private void sendExpoPushNotification(String expoPushToken, String title, String body, Map<String, Object> data)
            throws Exception {
        Map<String, Object> notification = new HashMap<>();
        notification.put("to", expoPushToken);
        notification.put("title", title);
        notification.put("body", body);
        notification.put("sound", "default");
        notification.put("priority", "high");

        if (data != null) {
            notification.put("data", data);
        }

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
                throw new RuntimeException("Expo push failed: " + response.code() + " - " + response.body().string());
            }
        }
    }

    /**
     * Send WebSocket notification to user for real-time updates
     */
    private void sendWebSocketNotification(UUID userId, String type, Map<String, Object> data) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", type);
            message.put("timestamp", LocalDateTime.now().toString());
            message.putAll(data);

            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    "/queue/notifications",
                    message);
            log.debug("WebSocket notification sent to user {}", userId);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Send alert status update notification to user
     * Called when a responder updates the status of an alert (accepted, en_route,
     * arrived, resolved, etc.)
     */
    @Transactional
    public void sendAlertStatusUpdate(UUID userId, UUID alertId, String newStatus, UUID responderId) {
        log.info("Sending alert status update notification: userId={}, alertId={}, status={}, responderId={}",
                userId, alertId, newStatus, responderId);

        // Check if the user still exists before creating notification
        Optional<User> alertUser = userRepository.findById(userId);
        if (alertUser.isEmpty()) {
            log.warn("Cannot send alert status update notification: user {} not found (may have been deleted)", userId);
            return;
        }

        // Get responder name for the notification
        String responderName = "A responder";
        Optional<User> responderUser = userRepository.findById(responderId);
        if (responderUser.isPresent()) {
            responderName = responderUser.get().getFullName();
        }

        // Create notification title and message based on status
        String title;
        String message;
        Notification.NotificationType notificationType;

        switch (newStatus.toUpperCase()) {
            case "ACCEPTED":
                title = "✅ Help is on the way!";
                message = String.format("%s has accepted your emergency alert and is coming to help.", responderName);
                notificationType = Notification.NotificationType.EMERGENCY_ACCEPTED;
                break;
            case "EN_ROUTE":
                title = "🚗 Responder en route";
                message = String.format("%s is on their way to your location.", responderName);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
                break;
            case "ARRIVED":
                title = "📍 Responder arrived";
                message = String.format("%s has arrived at your location.", responderName);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
                break;
            case "RESOLVED":
                title = "✨ Alert resolved";
                message = String.format("Your emergency alert has been resolved by %s. Stay safe!", responderName);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
                break;
            case "CANCELED":
                title = "🔴 Response canceled";
                message = String.format("%s has canceled their response. We are finding another responder.",
                        responderName);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
                break;
            case "FORWARDED":
                title = "➡️ Alert forwarded";
                message = String.format("%s has forwarded your alert to additional responders.", responderName);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
                break;
            default:
                title = "🔔 Alert update";
                message = String.format("Your emergency alert status has been updated to: %s", newStatus);
                notificationType = Notification.NotificationType.SYSTEM_NOTIFICATION;
        }

        // Create payload
        Map<String, Object> payload = new HashMap<>();
        payload.put("alertId", alertId.toString());
        payload.put("status", newStatus);
        payload.put("responderId", responderId.toString());
        payload.put("responderName", responderName);
        payload.put("updatedAt", LocalDateTime.now().toString());

        // Create and save notification
        NotificationCreateDto notificationDto = new NotificationCreateDto(
                userId,
                notificationType,
                Notification.NotificationChannel.BOTH, // Send via push and in-app
                title,
                message,
                payload,
                10 // High priority for status updates
        );

        createNotification(notificationDto);

        // Also send via WebSocket for real-time update
        sendWebSocketNotification(userId, "ALERT_STATUS_UPDATE", payload);

        log.info("Alert status update notification sent successfully for alert {}", alertId);
    }

    /**
     * Poke alert - Send notification to additional nearby responders
     * Used when victim wants to notify more responders for their active alert
     * 
     * @param alert      The alert to poke
     * @param victim     The victim user
     * @param excludeIds List of responder IDs already notified (to exclude)
     * @return Number of new responders notified
     */
    @Transactional
    public int pokeAlertToNewResponders(Alert alert, User victim, List<UUID> excludeIds) {
        log.info("Poking alert {} - finding new responders (excluding {} already notified)",
                alert.getId(), excludeIds.size());

        // Get active responders excluding already notified ones
        List<Responder> activeResponders = responderRepository.findByStatusAndIsActiveTrue(Responder.Status.AVAILABLE)
                .stream()
                .filter(r -> !excludeIds.contains(r.getUserId()))
                .filter(r -> r.getUser() != null)
                .toList();

        if (activeResponders.isEmpty()) {
            log.warn("No new active responders available for alert: {}", alert.getId());
            return 0;
        }

        // Calculate distance and sort by nearest
        List<ResponderWithDistance> sortedResponders = activeResponders.stream()
                .map(responder -> new ResponderWithDistance(responder,
                        calculateDistance(alert.getLatitude(), alert.getLongitude(),
                                responder.getUser().getCurrentLatitude(), responder.getUser().getCurrentLongitude())))
                .sorted(Comparator.comparingDouble(ResponderWithDistance::getDistance))
                .limit(BATCH_SIZE) // Send to BATCH_SIZE new responders per poke
                .collect(Collectors.toList());

        if (sortedResponders.isEmpty()) {
            log.warn("No new responders found within range for poke alert: {}", alert.getId());
            return 0;
        }

        int notifiedCount = 0;
        int pokeNumber = (alert.getPokeCount() != null ? alert.getPokeCount() : 0) + 1;

        for (ResponderWithDistance responderWithDistance : sortedResponders) {
            Responder responder = responderWithDistance.getResponder();

            // Create AlertResponder record with PENDING status
            if (!alertResponderRepository.existsByAlertIdAndResponderId(alert.getId(), responder.getUserId())) {
                AlertResponder alertResponder = new AlertResponder(
                        alert.getId(),
                        responder.getUserId(),
                        AlertStatus.PENDING);
                alertResponder.setNotes("poke_" + pokeNumber);
                alertResponderRepository.save(alertResponder);
                log.info("Created PENDING AlertResponder record for responder: {} alert: {} (poke {})",
                        responder.getUserId(), alert.getId(), pokeNumber);
            }

            // Create notification payload
            Map<String, Object> payload = createAlertPayload(alert);
            payload.put("distance", responderWithDistance.getDistance());
            payload.put("responderType", responder.getResponderType());
            payload.put("pokeNumber", pokeNumber);
            payload.put("expiresAt", LocalDateTime.now().plus(EMERGENCY_TTL));
            payload.put("isPoke", true);

            String title = "🚨 Urgent! Emergency Alert - Additional Help Needed";
            String message = String.format(
                    "Emergency alert %.2fkm away needs additional help! Location: %s. " +
                            "This is poke #%d - please respond urgently if available.",
                    responderWithDistance.getDistance(),
                    alert.getAddress() != null ? alert.getAddress() : "Location not available",
                    pokeNumber);

            // Create and save notification with TTL
            createNotificationWithTTL(
                    responder.getUserId(),
                    Notification.NotificationType.EMERGENCY_NEARBY,
                    Notification.NotificationChannel.BOTH,
                    title,
                    message,
                    payload,
                    15, // High priority for emergency
                    alert.getId(),
                    pokeNumber);

            log.info("Poke notification sent to responder: {} for alert: {} (poke {})",
                    responder.getUserId(), alert.getId(), pokeNumber);

            notifiedCount++;
        }

        log.info("Poke alert {} complete - notified {} new responders", alert.getId(), notifiedCount);
        return notifiedCount;
    }
}
