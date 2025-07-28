package com.secureherai.secureherai_api.service;

import com.google.firebase.messaging.*;
import com.secureherai.secureherai_api.entity.UserDevice;
import com.secureherai.secureherai_api.repository.UserDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FCMService {
    
    private final FirebaseMessaging firebaseMessaging;
    private final UserDeviceRepository userDeviceRepository;
    
    /**
     * Register FCM token for a user
     */
    public boolean registerFCMToken(UUID userId, String fcmToken, String deviceName, String browserInfo) {
        try {
            // Check if token already exists
            Optional<UserDevice> existingDevice = userDeviceRepository.findByFcmToken(fcmToken);
            
            if (existingDevice.isPresent()) {
                UserDevice device = existingDevice.get();
                if (!device.getUserId().equals(userId)) {
                    // Token belongs to a different user, deactivate old and create new
                    device.deactivate();
                    userDeviceRepository.save(device);
                    createNewDevice(userId, fcmToken, deviceName, browserInfo);
                } else {
                    // Same user, just activate and update
                    device.activate();
                    if (deviceName != null) device.setDeviceName(deviceName);
                    if (browserInfo != null) device.setBrowserInfo(browserInfo);
                    userDeviceRepository.save(device);
                }
            } else {
                // New token, create new device record
                createNewDevice(userId, fcmToken, deviceName, browserInfo);
            }
            
            log.info("FCM token registered successfully for user: {}", userId);
            return true;
            
        } catch (Exception e) {
            log.error("Failed to register FCM token for user: {}", userId, e);
            return false;
        }
    }
    
    private void createNewDevice(UUID userId, String fcmToken, String deviceName, String browserInfo) {
        UserDevice newDevice = new UserDevice();
        newDevice.setUserId(userId);
        newDevice.setFcmToken(fcmToken);
        newDevice.setDeviceType(UserDevice.DeviceType.WEB_BROWSER); // Assuming web for now
        newDevice.setDeviceName(deviceName);
        newDevice.setBrowserInfo(browserInfo);
        newDevice.setIsActive(true);
        newDevice.markAsUsed();
        
        userDeviceRepository.save(newDevice);
    }
    
    /**
     * Unregister FCM token
     */
    public boolean unregisterFCMToken(String fcmToken) {
        try {
            int updated = userDeviceRepository.deactivateDeviceByFcmToken(fcmToken);
            log.info("FCM token unregistered: {} (devices updated: {})", fcmToken, updated);
            return updated > 0;
        } catch (Exception e) {
            log.error("Failed to unregister FCM token: {}", fcmToken, e);
            return false;
        }
    }
    
    /**
     * Unregister all FCM tokens for a user
     */
    public boolean unregisterAllTokensForUser(UUID userId) {
        try {
            int updated = userDeviceRepository.deactivateAllDevicesForUser(userId);
            log.info("All FCM tokens unregistered for user: {} (devices updated: {})", userId, updated);
            return updated > 0;
        } catch (Exception e) {
            log.error("Failed to unregister all FCM tokens for user: {}", userId, e);
            return false;
        }
    }
    
    /**
     * Send push notification to a specific user
     */
    public boolean sendNotificationToUser(UUID userId, String title, String body, Map<String, String> data) {
        try {
            List<String> fcmTokens = userDeviceRepository.findActiveFcmTokensByUserId(userId);
            
            if (fcmTokens.isEmpty()) {
                log.warn("No active FCM tokens found for user: {}", userId);
                return false;
            }
            
            return sendNotificationToTokens(fcmTokens, title, body, data);
            
        } catch (Exception e) {
            log.error("Failed to send notification to user: {}", userId, e);
            return false;
        }
    }
    
    /**
     * Send push notification to multiple users
     */
    public boolean sendNotificationToUsers(List<UUID> userIds, String title, String body, Map<String, String> data) {
        try {
            List<String> allTokens = new ArrayList<>();
            
            for (UUID userId : userIds) {
                List<String> userTokens = userDeviceRepository.findActiveFcmTokensByUserId(userId);
                allTokens.addAll(userTokens);
            }
            
            if (allTokens.isEmpty()) {
                log.warn("No active FCM tokens found for users: {}", userIds);
                return false;
            }
            
            return sendNotificationToTokens(allTokens, title, body, data);
            
        } catch (Exception e) {
            log.error("Failed to send notification to users: {}", userIds, e);
            return false;
        }
    }
    
    /**
     * Send push notification to specific FCM tokens
     */
    public boolean sendNotificationToTokens(List<String> fcmTokens, String title, String body, Map<String, String> data) {
        if (firebaseMessaging == null) {
            log.warn("Firebase messaging is not available. Push notification will be skipped.");
            return false;
        }
        
        try {
            // Create notification
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();
            
            // Create web push config for better web support
            WebpushConfig webpushConfig = WebpushConfig.builder()
                    .setNotification(WebpushNotification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .setIcon("/assets/images/notification_icon.png")
                            .setBadge("/assets/images/badge_icon.png")
                            .setRequireInteraction(true)
                            .build())
                    .build();
            
            // Prepare data payload
            Map<String, String> dataPayload = data != null ? data : new HashMap<>();
            dataPayload.put("timestamp", String.valueOf(System.currentTimeMillis()));
            
            // Send to multiple tokens
            if (fcmTokens.size() == 1) {
                // Single token
                Message message = Message.builder()
                        .setToken(fcmTokens.get(0))
                        .setNotification(notification)
                        .setWebpushConfig(webpushConfig)
                        .putAllData(dataPayload)
                        .build();
                
                String response = firebaseMessaging.send(message);
                log.info("Successfully sent message to token: {} - Response: {}", fcmTokens.get(0), response);
                
                // Update last used timestamp
                userDeviceRepository.updateLastUsedAt(fcmTokens.get(0), LocalDateTime.now());
                
            } else {
                // Multiple tokens - use multicast
                MulticastMessage multicastMessage = MulticastMessage.builder()
                        .addAllTokens(fcmTokens)
                        .setNotification(notification)
                        .setWebpushConfig(webpushConfig)
                        .putAllData(dataPayload)
                        .build();
                
                BatchResponse response = firebaseMessaging.sendEachForMulticast(multicastMessage);
                log.info("Successfully sent multicast message. Success: {}, Failure: {}", 
                        response.getSuccessCount(), response.getFailureCount());
                
                // Handle failed tokens
                if (response.getFailureCount() > 0) {
                    List<SendResponse> responses = response.getResponses();
                    for (int i = 0; i < responses.size(); i++) {
                        if (!responses.get(i).isSuccessful()) {
                            String failedToken = fcmTokens.get(i);
                            log.warn("Failed to send to token: {} - Error: {}", 
                                    failedToken, responses.get(i).getException().getMessage());
                            
                            // Deactivate invalid tokens
                            if (shouldRemoveToken(responses.get(i).getException())) {
                                userDeviceRepository.deactivateDeviceByFcmToken(failedToken);
                                log.info("Deactivated invalid FCM token: {}", failedToken);
                            }
                        } else {
                            // Update last used timestamp for successful sends
                            userDeviceRepository.updateLastUsedAt(fcmTokens.get(i), LocalDateTime.now());
                        }
                    }
                }
            }
            
            return true;
            
        } catch (Exception e) {
            log.error("Failed to send push notification", e);
            return false;
        }
    }
    
    /**
     * Check if the exception indicates an invalid token that should be removed
     */
    private boolean shouldRemoveToken(Exception exception) {
        if (exception instanceof FirebaseMessagingException) {
            FirebaseMessagingException fme = (FirebaseMessagingException) exception;
            String errorCode = fme.getErrorCode() != null ? fme.getErrorCode().toString() : "";
            return "UNREGISTERED".equals(errorCode) || 
                   "INVALID_ARGUMENT".equals(errorCode) ||
                   "INVALID_REGISTRATION".equals(errorCode);
        }
        return false;
    }
    
    /**
     * Clean up old inactive devices
     */
    public int cleanupOldDevices(int daysOld) {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
            int deleted = userDeviceRepository.deleteInactiveDevicesOlderThan(cutoffDate);
            log.info("Cleaned up {} old inactive devices older than {} days", deleted, daysOld);
            return deleted;
        } catch (Exception e) {
            log.error("Failed to cleanup old devices", e);
            return 0;
        }
    }
    
    /**
     * Get user device statistics
     */
    public Map<String, Object> getUserDeviceStats(UUID userId) {
        try {
            List<UserDevice> allDevices = userDeviceRepository.findByUserId(userId);
            int activeCount = userDeviceRepository.countByUserIdAndIsActiveTrue(userId);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalDevices", allDevices.size());
            stats.put("activeDevices", activeCount);
            stats.put("inactiveDevices", allDevices.size() - activeCount);
            stats.put("devices", allDevices);
            
            return stats;
        } catch (Exception e) {
            log.error("Failed to get device stats for user: {}", userId, e);
            return new HashMap<>();
        }
    }
}
