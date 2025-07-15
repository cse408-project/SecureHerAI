package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.entity.Settings;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.SettingsRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service for managing user settings including notification preferences and SOS keyword
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {
    
    private final SettingsRepository settingsRepository;
    private final UserRepository userRepository;
    
    /**
     * Get user settings, create default if not exists
     */
    public Settings getUserSettings(UUID userId) {
        return settingsRepository.findByUserId(userId)
            .orElseGet(() -> createDefaultSettings(userId));
    }
    
    /**
     * Create default settings for a user
     */
    @Transactional
    public Settings createDefaultSettings(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        Settings settings = new Settings(user);
        return settingsRepository.save(settings);
    }
    
    /**
     * Update user settings
     */
    @Transactional
    public Settings updateSettings(UUID userId, Boolean emailAlerts, Boolean smsAlerts, 
                                 Boolean pushNotifications, String sosKeyword) {
        Settings settings = getUserSettings(userId);
        
        if (emailAlerts != null) {
            settings.setEmailAlerts(emailAlerts);
        }
        if (smsAlerts != null) {
            settings.setSmsAlerts(smsAlerts);
        }
        if (pushNotifications != null) {
            settings.setPushNotifications(pushNotifications);
        }
        if (sosKeyword != null && !sosKeyword.trim().isEmpty()) {
            settings.setSosKeyword(sosKeyword.trim().toLowerCase());
        }
        
        return settingsRepository.save(settings);
    }
    
    /**
     * Update SOS keyword specifically
     */
    @Transactional
    public Settings updateSosKeyword(UUID userId, String sosKeyword) {
        Settings settings = getUserSettings(userId);
        settings.setSosKeyword(sosKeyword != null ? sosKeyword.trim().toLowerCase() : "help");
        return settingsRepository.save(settings);
    }
    
    /**
     * Get SOS keyword for a user
     */
    public String getSosKeyword(UUID userId) {
        Settings settings = getUserSettings(userId);
        return settings.getSosKeyword();
    }
    
    /**
     * Update notification preferences only
     */
    @Transactional
    public Settings updateNotificationPreferences(UUID userId, Boolean emailAlerts, 
                                                Boolean smsAlerts, Boolean pushNotifications) {
        Settings settings = getUserSettings(userId);
        
        if (emailAlerts != null) {
            settings.setEmailAlerts(emailAlerts);
        }
        if (smsAlerts != null) {
            settings.setSmsAlerts(smsAlerts);
        }
        if (pushNotifications != null) {
            settings.setPushNotifications(pushNotifications);
        }
        
        return settingsRepository.save(settings);
    }
}
