package com.secureherai.secureherai_api.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.repository.UserRepository;

@Service
@Transactional
public class AuthService {    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ResponderRepository responderRepository;
    
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
        
        // Generate 6-digit login code
        String loginCode = String.format("%06d", (int)(Math.random() * 1000000));
        user.setLoginCode(loginCode);
        user.setLoginCodeExpiry(LocalDateTime.now().plusMinutes(10)); // Code expires in 10 minutes
        
        userRepository.save(user);
        
        // Send login code email
        try {
            emailService.sendLoginCodeEmail(user.getEmail(), user.getFullName(), loginCode);
            return new AuthResponse.Success("Login code sent to your email. Please check your inbox.");
        } catch (Exception e) {
            // Clear the login code if email fails
            user.setLoginCode(null);
            user.setLoginCodeExpiry(null);
            userRepository.save(user);
            return new AuthResponse.Error("Failed to send login code. Please try again later.");
        }
    }
    
    @Transactional(rollbackFor = Exception.class)
    public Object register(AuthRequest.Register request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            return new AuthResponse.Error("Email already registered");
        }
        
        // Check if phone already exists
        if (userRepository.existsByPhone(request.getPhoneNumber())) {
            return new AuthResponse.Error("Phone number already registered");
        }
          // Validate role
        String role = request.getRole();
        if (role == null || role.isEmpty()) {
            return new AuthResponse.Error("Role is required. Must be USER or RESPONDER");
        }
        
        role = role.toUpperCase();
        if (!role.equals("USER") && !role.equals("RESPONDER")) {
            return new AuthResponse.Error("Invalid role. Must be USER or RESPONDER");
        }
        
        // If registering as responder, validate responder-specific fields
        if (role.equals("RESPONDER")) {
            if (request.getResponderType() == null || request.getResponderType().isEmpty()) {
                return new AuthResponse.Error("Responder type is required for responder registration");
            }
            
            if (request.getBadgeNumber() == null || request.getBadgeNumber().isEmpty()) {
                return new AuthResponse.Error("Badge number is required for responder registration");
            }
            
            // Validate responder type
            String responderType = request.getResponderType().toUpperCase();
            if (!isValidResponderType(responderType)) {
                return new AuthResponse.Error("Invalid responder type. Must be POLICE, MEDICAL, FIRE, SECURITY, or OTHER");
            }
            
            // Check if badge number already exists
            if (responderRepository.existsByBadgeNumber(request.getBadgeNumber())) {
                return new AuthResponse.Error("Badge number already registered");
            }
        }
        
        // Create new user
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(User.Role.valueOf(role));
        
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            try {
                user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth(), DateTimeFormatter.ISO_LOCAL_DATE));
            } catch (Exception e) {
                return new AuthResponse.Error("Invalid date format. Use YYYY-MM-DD");
            }
        }
        
        // Save user first to get the ID
        user = userRepository.save(user);
        
        // If registering as responder, create responder record
        if (role.equals("RESPONDER")) {
            try {
                Responder responder = new Responder();
                responder.setUser(user); // This will handle the mapping with @MapsId
                responder.setResponderType(Responder.ResponderType.valueOf(request.getResponderType().toUpperCase()));
                responder.setBadgeNumber(request.getBadgeNumber());
                responderRepository.save(responder);
            } catch (Exception e) {
                // Log the error
                System.err.println("Error creating responder: " + e.getMessage());
                e.printStackTrace();
                // Return error response
                return new AuthResponse.Error("Error creating responder profile: " + e.getMessage());
            }
        }
        
        // Send welcome email with verification instructions
        try {
            emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
            
            // For responders, send additional information
            if (role.equals("RESPONDER")) {
                // You can add a specialized email for responders here
                // emailService.sendResponderWelcomeEmail(user.getEmail(), user.getFullName());
            }
        } catch (Exception e) {
            // Log but don't fail registration if email fails
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
        
        return new AuthResponse.Success("User registered successfully");
    }
    
    private boolean isValidResponderType(String responderType) {
        try {
            Responder.ResponderType.valueOf(responderType);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
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

    public Object verifyLoginCode(AuthRequest.VerifyLoginCode request) {
        if (request.getLoginCode() == null || request.getLoginCode().trim().isEmpty()) {
            return new AuthResponse.Error("Login code is required");
        }
        
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        
        if (userOpt.isEmpty()) {
            return new AuthResponse.Error("Invalid email or login code");
        }
        
        User user = userOpt.get();
        
        // Check if login code exists and matches
        if (user.getLoginCode() == null || !user.getLoginCode().equals(request.getLoginCode().trim())) {
            return new AuthResponse.Error("Invalid email or login code");
        }
        
        // Check if login code has expired
        if (user.getLoginCodeExpiry() == null || user.getLoginCodeExpiry().isBefore(LocalDateTime.now())) {
            // Clear expired login code
            user.setLoginCode(null);
            user.setLoginCodeExpiry(null);
            userRepository.save(user);
            return new AuthResponse.Error("Login code has expired. Please request a new login code.");
        }
        
        // Login code is valid, clear it and generate JWT token
        user.setLoginCode(null);
        user.setLoginCodeExpiry(null);
        
        // Verification temporarily handled in-memory only
        // We'll consider any account as verified once they've logged in successfully
        user.setIsVerified(true);
        
        userRepository.save(user);
        
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse.Success(token, user.getId().toString(), user.getFullName(), user.getRole().name());
    }
}
