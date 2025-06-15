package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ResponderRepository responderRepository;    public Object getProfile(UUID userId) {
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
            user.getPushNotifications(),
            user.getRole().toString()
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
    }    public Object updateProfile(UUID userId, AuthRequest.UpdateProfile request) {
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
        
        // Handle responder-specific updates
        if (user.getRole() == User.Role.RESPONDER && request.getStatus() != null) {
            Optional<Responder> responderOpt = responderRepository.findByUserId(userId);
            if (responderOpt.isPresent()) {
                try {
                    Responder.Status status = Responder.Status.valueOf(request.getStatus().toUpperCase());
                    Responder responder = responderOpt.get();
                    responder.setStatus(status);
                    responderRepository.save(responder);
                } catch (IllegalArgumentException e) {
                    return new AuthResponse.Error("Invalid status. Must be AVAILABLE, BUSY, or OFF_DUTY");
                }
            } else {
                return new AuthResponse.Error("Responder profile not found");
            }
        }
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Profile updated successfully");
    }
}
