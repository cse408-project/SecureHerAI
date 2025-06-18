package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.notification.NotificationResponse;
import com.secureherai.secureherai_api.entity.AlertNotification;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.repository.AlertNotificationRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AlertNotificationRepository alertNotificationRepository;    /**
     * Update notification preferences for a user
     */
    public NotificationResponse.GenericResponse updateNotificationPreferences(UUID userId, Boolean emailAlerts, Boolean smsAlerts, Boolean pushNotifications) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            User user = userOpt.get();
            
            // Update notification preferences
            user.setEmailAlerts(emailAlerts);
            user.setSmsAlerts(smsAlerts);
            user.setPushNotifications(pushNotifications);
            
            userRepository.save(user);
            
            return new NotificationResponse.GenericResponse(true, "Notification preferences updated successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new NotificationResponse.GenericResponse(false, null, "An error occurred while updating notification preferences: " + e.getMessage());
        }
    }

    /**
     * Get notification preferences for a user
     */
    public NotificationResponse.GetPreferencesResponse getNotificationPreferences(UUID userId) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            User user = userOpt.get();
            
            // Create preferences response
            NotificationResponse.NotificationPreferences preferences = new NotificationResponse.NotificationPreferences(
                user.getEmailAlerts(),
                user.getSmsAlerts(),
                user.getPushNotifications()
            );
            
            return new NotificationResponse.GetPreferencesResponse(true, preferences, null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new NotificationResponse.GetPreferencesResponse(false, null, "An error occurred while retrieving notification preferences: " + e.getMessage());
        }
    }

    /**
     * Get alert notifications for a specific alert
     */
    public List<NotificationResponse.AlertNotificationInfo> getAlertNotifications(UUID alertId) {
        try {
            List<AlertNotification> notifications = alertNotificationRepository.findByAlertId(alertId);
            
            return notifications.stream()
                .map(notification -> new NotificationResponse.AlertNotificationInfo(
                    notification.getId(),
                    notification.getAlertId(),
                    notification.getContactId(),
                    notification.getRecipientType(),
                    notification.getRecipientName(),
                    notification.getStatus(),
                    notification.getNotificationTime()
                ))
                .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("An error occurred while retrieving alert notifications: " + e.getMessage());
        }
    }

    /**
     * Create a new alert notification
     */
    public NotificationResponse.GenericResponse createAlertNotification(UUID alertId, UUID contactId, 
                                                                      String recipientType, String recipientName, String status) {
        try {
            AlertNotification notification = new AlertNotification(alertId, contactId, recipientType, recipientName, status);
            alertNotificationRepository.save(notification);
            
            return new NotificationResponse.GenericResponse(true, "Alert notification created successfully.", null);

        } catch (Exception e) {
            return new NotificationResponse.GenericResponse(false, null, "An error occurred while creating alert notification: " + e.getMessage());
        }
    }

    /**
     * Update alert notification status
     */
    public NotificationResponse.GenericResponse updateNotificationStatus(UUID notificationId, String status) {
        try {
            Optional<AlertNotification> notificationOpt = alertNotificationRepository.findById(notificationId);
            if (notificationOpt.isEmpty()) {
                return new NotificationResponse.GenericResponse(false, null, "Notification not found");
            }

            AlertNotification notification = notificationOpt.get();
            notification.setStatus(status);
            alertNotificationRepository.save(notification);
            
            return new NotificationResponse.GenericResponse(true, "Notification status updated successfully.", null);

        } catch (Exception e) {
            return new NotificationResponse.GenericResponse(false, null, "An error occurred while updating notification status: " + e.getMessage());
        }
    }

    /**
     * Get failed notifications for retry
     */
    public List<NotificationResponse.AlertNotificationInfo> getFailedNotifications() {
        try {
            // Get failed notifications from the last 24 hours
            List<AlertNotification> failedNotifications = alertNotificationRepository.findFailedNotificationsSince(
                java.time.LocalDateTime.now().minusHours(24)
            );
            
            return failedNotifications.stream()
                .map(notification -> new NotificationResponse.AlertNotificationInfo(
                    notification.getId(),
                    notification.getAlertId(),
                    notification.getContactId(),
                    notification.getRecipientType(),
                    notification.getRecipientName(),
                    notification.getStatus(),
                    notification.getNotificationTime()
                ))
                .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("An error occurred while retrieving failed notifications: " + e.getMessage());
        }
    }
}
