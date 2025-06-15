package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

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
        
        return new AuthResponse.Profile(userProfile);
    }

    public Object updateProfile(UUID userId, AuthRequest.UpdateProfile request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        // Update fields if they are provided
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
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Profile updated successfully");
    }

    public Object completeProfile(UUID userId, com.secureherai.secureherai_api.dto.user.CompleteProfileRequest request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        user.setPhone(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setIsProfileComplete(true);
        userRepository.save(user);
        
        // Generate new token with updated profile status
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
