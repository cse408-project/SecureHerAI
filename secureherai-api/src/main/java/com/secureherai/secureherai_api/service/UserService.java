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

    public Object getProfile(UUID userId) {
        
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        AuthResponse.Profile.UserProfile userProfile = new AuthResponse.Profile.UserProfile(
            user.getId().toString(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getProfilePicture(),
            user.getDateOfBirth(),
            user.getEmailAlerts(),
            user.getSmsAlerts(),
            user.getPushNotifications()
        );

        // If user is a responder, include responder-specific information
        if (user.getRole() == User.Role.RESPONDER) {
            Optional<Responder> responderOpt = responderRepository.findByUserId(userId);
            if (responderOpt.isPresent()) {
                Responder responder = responderOpt.get();
                AuthResponse.Profile.UserProfile.ResponderInfo responderInfo = 
                    new AuthResponse.Profile.UserProfile.ResponderInfo(
                        responder.getResponderType().toString(),
                        responder.getBadgeNumber(),
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
            user.setProfilePicture(request.getProfilePicture());
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
        
        // Update notification preferences if provided
        if (request.getEmailAlerts() != null) {
            user.setEmailAlerts(request.getEmailAlerts());
        }
        
        if (request.getSmsAlerts() != null) {
            user.setSmsAlerts(request.getSmsAlerts());
        }
        
        if (request.getPushNotifications() != null) {
            user.setPushNotifications(request.getPushNotifications());
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
            
            responderRepository.save(responder);
        }
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Profile updated successfully");
    }

    public Object completeProfile(UUID userId, com.secureherai.secureherai_api.dto.user.CompleteProfileRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        // Check if profile is already complete
        if (user.getIsProfileComplete()) {
            return new AuthResponse.Error("Profile is already complete");
        }
        
        // Update basic user information
        user.setPhone(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        
        // Update role if provided
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                User.Role role = User.Role.valueOf(request.getRole().toUpperCase());
                user.setRole(role);
            } catch (IllegalArgumentException e) {
                return new AuthResponse.Error("Invalid role: " + request.getRole() + ". Must be USER, RESPONDER, or ADMIN");
            }
        }
        
        // Save user first to ensure it exists for responder relationship
        user.setIsProfileComplete(true);
        // Ensure the user is marked as verified when completing their profile
        user.setIsVerified(true);
        user = userRepository.save(user);
        
        // Handle responder creation if user role is RESPONDER
        if (user.getRole() == User.Role.RESPONDER) {
            // Validate responder fields
            if (request.getResponderType() == null || request.getResponderType().isEmpty()) {
                return new AuthResponse.Error("Responder type is required for responder registration");
            }
            
            if (request.getBadgeNumber() == null || request.getBadgeNumber().isEmpty()) {
                return new AuthResponse.Error("Badge number is required for responder registration");
            }
            
            // Check if badge number already exists
            if (responderRepository.existsByBadgeNumber(request.getBadgeNumber())) {
                return new AuthResponse.Error("Badge number already registered");
            }
            
            try {
                Responder responder = new Responder();
                responder.setUser(user);
                responder.setResponderType(Responder.ResponderType.valueOf(request.getResponderType().toUpperCase()));
                responder.setBadgeNumber(request.getBadgeNumber());
                responderRepository.save(responder);
            } catch (IllegalArgumentException e) {
                return new AuthResponse.Error("Invalid responder type: " + request.getResponderType());
            } catch (Exception e) {
                return new AuthResponse.Error("Error creating responder profile: " + e.getMessage());
            }
        }
        
        // Generate new token with updated profile status and role
        String newToken = jwtService.generateTokenWithProfileStatus(
            user.getId(),
            user.getEmail(),
            user.getRole().name(),
            true
        );
        
        // Create response
        AuthResponse.CompleteProfile response = new AuthResponse.CompleteProfile();
        response.setSuccess(true);
        response.setToken(newToken);
        response.setMessage("Profile completed successfully");
        
        return response;
    }
}