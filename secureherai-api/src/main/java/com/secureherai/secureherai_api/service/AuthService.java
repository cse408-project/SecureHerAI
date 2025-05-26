package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private EmailService emailService;

    public Object login(AuthRequest.Login request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("Invalid email or password");
        }
        
        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return new AuthResponse.Error("Invalid email or password");
        }
        
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse.Success(token, user.getId().toString(), user.getFullName(), user.getRole().name());
    }

    public Object register(AuthRequest.Register request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse.Error("Email already registered");
        }
        
        // Check if phone already exists
        if (userRepository.existsByPhone(request.getPhoneNumber())) {
            return new AuthResponse.Error("Phone number already registered");
        }
        
        // Create new user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            try {
                user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth(), DateTimeFormatter.ISO_LOCAL_DATE));
            } catch (Exception e) {
                return new AuthResponse.Error("Invalid date format. Use YYYY-MM-DD");
            }
        }
        
        userRepository.save(user);
        
        // Send welcome email
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
        } catch (Exception e) {
            // Log but don't fail registration if email fails
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
        
        return new AuthResponse.Success("User registered successfully");
    }

    public Object forgotPassword(AuthRequest.ForgotPassword request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("Email not found");
        }
        
        User user = userOpt.get();
        
        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusHours(1)); // Token expires in 1 hour
        
        userRepository.save(user);
        
        // Send password reset email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), resetToken);
            return new AuthResponse.Success("Password reset instructions sent to your email");
        } catch (Exception e) {
            // Reset the token fields if email fails
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            return new AuthResponse.Error("Failed to send reset email. Please try again later.");
        }
    }

    public Object resetPassword(AuthRequest.ResetPassword request) {
        if (request.getToken() == null || request.getToken().trim().isEmpty()) {
            return new AuthResponse.Error("Reset token is required");
        }
        
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            return new AuthResponse.Error("Password must be at least 8 characters long");
        }
        
        Optional<User> userOpt = userRepository.findByResetToken(request.getToken());
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("Invalid or expired token");
        }
        
        User user = userOpt.get();
        
        // Check if token has expired
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            // Clear expired token
            user.setResetToken(null);
            user.setResetTokenExpiry(null);
            userRepository.save(user);
            return new AuthResponse.Error("Invalid or expired token");
        }
        
        // Update password and clear reset token
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        
        userRepository.save(user);
        
        return new AuthResponse.Success("Password reset successful");
    }

    public Object getProfile(UUID userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        AuthResponse.Profile.UserProfile profile = new AuthResponse.Profile.UserProfile(
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
        
        return new AuthResponse.Profile(profile);
    }

    public Object updateProfile(UUID userId, AuthRequest.UpdateProfile request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("User not found");
        }
        
        User user = userOpt.get();
        
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        
        if (request.getPhoneNumber() != null) {
            // Check if phone is already taken by another user
            Optional<User> existingUser = userRepository.findByPhone(request.getPhoneNumber());
            if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
                return new AuthResponse.Error("Phone number already in use");
            }
            user.setPhone(request.getPhoneNumber());
        }
        
        if (request.getProfilePicture() != null) {
            user.setProfilePicture(request.getProfilePicture());
        }
        
        userRepository.save(user);
        return new AuthResponse.Success("Profile updated successfully");
    }
}
