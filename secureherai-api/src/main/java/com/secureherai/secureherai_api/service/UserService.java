package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ResponderRepository responderRepository;
    @Autowired
    private SettingsService settingsService;

    public Object getProfile(UUID userId) {
        
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        // Get user settings
        com.secureherai.secureherai_api.entity.Settings userSettings = settingsService.getUserSettings(userId);
        
        AuthResponse.Profile.UserProfile userProfile = new AuthResponse.Profile.UserProfile(
            user.getId().toString(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getProfilePicture(),
            user.getDateOfBirth(),
            userSettings.getEmailAlerts(),
            userSettings.getSmsAlerts(),
            userSettings.getPushNotifications(),
            user.getRole().toString()
        );
        
        // Set the settings directly
        AuthResponse.Profile.UserSettings settingsDto = new AuthResponse.Profile.UserSettings(
            userSettings.getEmailAlerts(),
            userSettings.getSmsAlerts(),
            userSettings.getPushNotifications(),
            userSettings.getSosKeyword()
        );
        userProfile.setSettings(settingsDto);

        // If user is a responder, include responder-specific information
        if (user.getRole() == User.Role.RESPONDER) {
            Optional<Responder> responderOpt = responderRepository.findByUserId(userId);
            if (responderOpt.isPresent()) {
                Responder responder = responderOpt.get();
                AuthResponse.Profile.UserProfile.ResponderInfo responderInfo = 
                    new AuthResponse.Profile.UserProfile.ResponderInfo(
                        responder.getResponderType().toString(),
                        responder.getBadgeNumber(),
                        responder.getBranchName(),
                        responder.getAddress(),
                        user.getCurrentLatitude(), // Get location from User entity
                        user.getCurrentLongitude(), // Get location from User entity
                        responder.getStatus().toString(),
                        responder.getIsActive(),
                        responder.getLastStatusUpdate()
                    );
                userProfile.setResponderInfo(responderInfo);
            }
        }
        
        return new AuthResponse.Profile(userProfile);
    }

    public Object updateProfile(UUID userId, AuthRequest.UpdateProfile request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        // Update user fields if they are provided
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().trim().isEmpty()) {
            // Check if phone number is already taken by another user
            Optional<User> existingUser = userRepository.findByPhone(request.getPhoneNumber().trim());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                return new AuthResponse.Error("Phone number already in use");
            }
            user.setPhone(request.getPhoneNumber().trim());
        }
        
        if (request.getProfilePicture() != null) {
            String profilePictureUrl = request.getProfilePicture().trim();
            
            // Basic URL validation - ensure it's a valid HTTP(S) URL
            if (!profilePictureUrl.isEmpty()) {
                if (!profilePictureUrl.startsWith("http://") && !profilePictureUrl.startsWith("https://")) {
                    return new AuthResponse.Error("Profile picture must be a valid URL starting with http:// or https://");
                }
                
                // Additional basic URL validation
                try {
                    new java.net.URL(profilePictureUrl);
                } catch (java.net.MalformedURLException e) {
                    return new AuthResponse.Error("Invalid profile picture URL format");
                }
            }
            
            user.setProfilePicture(profilePictureUrl.isEmpty() ? null : profilePictureUrl);
        }
        
        // Update date of birth if provided
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().trim().isEmpty()) {
            try {
                // Parse the date and set it
                LocalDate dateOfBirth = LocalDate.parse(request.getDateOfBirth());
                user.setDateOfBirth(dateOfBirth);
            } catch (DateTimeParseException e) {
                return new AuthResponse.Error("Invalid date format. Use YYYY-MM-DD format.");
            }
        }
        
        // Update notification preferences using Settings service if provided
        if (request.getEmailAlerts() != null || request.getSmsAlerts() != null || request.getPushNotifications() != null) {
            settingsService.updateNotificationPreferences(
                userId, 
                request.getEmailAlerts(), 
                request.getSmsAlerts(), 
                request.getPushNotifications()
            );
        }
        
        // Handle responder-specific updates
        if (user.getRole() == User.Role.RESPONDER) {
            Optional<Responder> responderOpt = responderRepository.findByUserId(userId);
            if (responderOpt.isEmpty()) {
                return new AuthResponse.Error("Responder profile not found");
            }
            
            Responder responder = responderOpt.get();
            
            // Update status if provided
            if (request.getStatus() != null) {
                try {
                    Responder.Status status = Responder.Status.valueOf(request.getStatus().toUpperCase());
                    responder.setStatus(status);
                } catch (IllegalArgumentException e) {
                    return new AuthResponse.Error("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY");
                }
            }
            
            // Update responder type if provided
            if (request.getResponderType() != null) {
                try {
                    Responder.ResponderType responderType = Responder.ResponderType.valueOf(request.getResponderType().toUpperCase());
                    responder.setResponderType(responderType);
                } catch (IllegalArgumentException e) {
                    return new AuthResponse.Error("Invalid responder type. Must be POLICE, MEDICAL, or FIRE");
                }
            }
            
            // Update badge number if provided
            if (request.getBadgeNumber() != null && !request.getBadgeNumber().trim().isEmpty()) {
                responder.setBadgeNumber(request.getBadgeNumber().trim());
            }
            
            // Update branch name if provided
            if (request.getBranchName() != null && !request.getBranchName().trim().isEmpty()) {
                responder.setBranchName(request.getBranchName().trim());
            }
            
            // Update address if provided
            if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
                responder.setAddress(request.getAddress().trim());
            }
            
            responderRepository.save(responder);
        }
        
        // Update current location if provided (for both regular users and responders)
        if (request.getCurrentLatitude() != null && request.getCurrentLongitude() != null) {
            user.setCurrentLatitude(java.math.BigDecimal.valueOf(request.getCurrentLatitude()));
            user.setCurrentLongitude(java.math.BigDecimal.valueOf(request.getCurrentLongitude()));
            user.setLastLocationUpdate(java.time.LocalDateTime.now());
        }
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Profile updated successfully");
    }

    public Object updateLocation(UUID userId, Double latitude, Double longitude) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        // Update location
        user.setCurrentLatitude(java.math.BigDecimal.valueOf(latitude));
        user.setCurrentLongitude(java.math.BigDecimal.valueOf(longitude));
        user.setLastLocationUpdate(java.time.LocalDateTime.now());
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Location updated successfully");
    }
}