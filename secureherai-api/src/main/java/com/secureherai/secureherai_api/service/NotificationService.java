package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.notification.NotificationCreateDto;
import com.secureherai.secureherai_api.dto.notification.NotificationResponseDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.Notification;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.TrustedContact;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.NotificationRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.repository.TrustedContactRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
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
    
    // TTL Configuration
    private static final Duration EMERGENCY_TTL = Duration.ofHours(1); // 1 hour TTL
    private static final int BATCH_SIZE = 2; // Send to 2 responders at a time
    private static final int MAX_RESPONDERS = 10; // Maximum responders to notify per alert
    
    /**
     * Create a new notification
     */
    @Transactional
    public NotificationResponseDto createNotification(NotificationCreateDto createDto) {
        log.info("Creating notification for user: {}, type: {}", createDto.getUserId(), createDto.getType());
        
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
            // Trusted contacts are external people, not app users, so we don't create in-app notifications
            if (contact.getEmail() != null && !contact.getEmail().isEmpty()) {
                sendEmergencyEmailToContact(contact, alert);
            }
            
            // TODO: Send SMS to trusted contact if SMS service is available
            // if (contact.getPhone() != null && !contact.getPhone().isEmpty()) {
            //     sendEmergencySMSToContact(contact, alert);
            // }
            
            log.info("Emergency notification sent to trusted contact: {} ({})", contact.getName(), contact.getPhone());
        }
    }
    
    /**
     * Send notifications to nearby active responders with TTL and 10-responder limit
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
                                responder.getUser().getCurrentLatitude(), responder.getUser().getCurrentLongitude()))) // Get location from User entity
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
        String message = String.format("Your emergency alert has been accepted by %s. Help is on the way!", responderName);
        
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
     * Get all notifications for a specific alert (both in-app and email notifications)
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
                // Get alert user ID from the alert payload or find the user who created the alert
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
                emailNotification.put("sentAt", inAppNotifications.isEmpty() ? null : 
                    inAppNotifications.get(0).getCreatedAt());
                
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
                    Collectors.counting()
                ));
            summary.put("statusCounts", statusCounts);
            
            // Count by batch if available
            Map<Integer, Long> batchCounts = allInAppNotifications.stream()
                .filter(n -> n.getBatchNumber() != null)
                .collect(Collectors.groupingBy(
                    Notification::getBatchNumber,
                    Collectors.counting()
                ));
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
                batchNumber
            );
            
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
                batchNumber
            );
            
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
                    Notification.NotificationStatus.PENDING
                );
                
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
        alertResponder.setStatus("accepted");
        alertResponderRepository.save(alertResponder);
        
        // Mark all pending notifications for this alert as no longer needed
        List<Notification> pendingNotifications = notificationRepository.findByAlertIdAndTypeAndStatus(
            alertId,
            Notification.NotificationType.EMERGENCY_NEARBY,
            Notification.NotificationStatus.PENDING
        );
        
        pendingNotifications.forEach(notification -> {
            if (!notification.getUserId().equals(responderId)) {
                notification.setStatus(Notification.NotificationStatus.READ); // Cancel other invitations
                notificationRepository.save(notification);
            }
        });
        
        log.info("Responder {} accepted alert {}, created AlertResponder record, cancelled {} other pending invitations", 
            responderId, alertId, pendingNotifications.size() - 1);
    }
    
    /**
     * Check if alert is resolved (this is a placeholder - implement based on your Alert entity)
     */
    private boolean isAlertResolved(UUID alertId) {
        // This should check your Alert entity's status field
        // For now, assume alert is not resolved
        return false;
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
                            notification.getMessage()
                        );
                        log.info("Email notification sent for notification: {}", notification.getId());
                    } catch (Exception e) {
                        log.error("Failed to send email for notification: {}", notification.getId(), e);
                    }
                });
            }
            
            // Send push notifications for IN_APP or BOTH channels
            if (notification.getChannel() == Notification.NotificationChannel.IN_APP || 
                notification.getChannel() == Notification.NotificationChannel.BOTH) {
                
                // In-app notifications are saved to database (already done by createNotification)
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
                alert.getTriggeredAt().toString()
            );
            
            log.info("Emergency email sent to trusted contact: {} ({})", contact.getName(), contact.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to send emergency email to trusted contact: {} ({})", contact.getName(), contact.getEmail(), e);
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
     * Send push notification to user's devices
     * 
     * EXPLANATION: Push notifications are real-time alerts sent to user's devices
     * even when the app is closed. This is different from database notifications.
     * 
     * How it works:
     * 1. User's device registers with a push service (FCM, APNs, etc.)
     * 2. Device gets a unique "push token" 
     * 3. We store this token in our database
     * 4. When we want to notify the user, we send to the push service
     * 5. Push service delivers to the user's device
     * 
     * For your SecureHerAI app, this would need:
     * - Firebase/FCM setup for Android
     * - APNs setup for iOS  
     * - Web Push for browsers
     * - User device tokens stored in database
     */
    private void sendPushNotificationToUser(Notification notification) {
        try {
            // STEP 1: Get user's device tokens from database
            // You would need a UserDevice entity to store push tokens
            // List<String> pushTokens = userDeviceRepository.findPushTokensByUserId(notification.getUserId());
            
            // STEP 2: Send to each device using push service
            // For now, we just log what would happen
            log.info("🔔 PUSH NOTIFICATION EXPLANATION for notification {}", notification.getId());
            log.info("   📱 Would send to user's mobile devices (if FCM/APNs configured)");
            log.info("   💻 Would send to user's web browsers (if Web Push configured)");
            log.info("   📊 Database notification already saved by createNotification()");
            
            // STEP 3: Actual implementation would look like:
            /*
            for (String pushToken : pushTokens) {
                // For Firebase Cloud Messaging:
                Message message = Message.builder()
                    .setToken(pushToken)
                    .setNotification(NotificationDto.builder()
                        .setTitle(notification.getTitle())
                        .setBody(notification.getMessage())
                        .build())
                    .build();
                
                FirebaseMessaging.getInstance().send(message);
            }
            */
            
        } catch (Exception e) {
            log.error("Failed to send push notification for notification: {}", notification.getId(), e);
        }
    }
}
