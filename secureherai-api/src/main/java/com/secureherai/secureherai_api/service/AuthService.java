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
        
        // Check if user registered with Google OAuth
        if ("GOOGLE".equals(user.getOauthProvider())) {
            return new AuthResponse.Error("This email is registered with Google. Please sign in with Google instead.");
        }
        
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
        Optional<User> existingUser = userRepository.findByEmail(request.getEmail());
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            if ("GOOGLE".equals(user.getOauthProvider())) {
                return new AuthResponse.Error("This email is registered with Google. Please sign in with Google instead.");
            } else {
                return new AuthResponse.Error("Email already registered");
            }
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

    @Transactional(rollbackFor = Exception.class)
    public Object completeOAuthRegistration(AuthRequest.CompleteOAuthRegistration request) {
        try {
            // Extract and validate the temporary token
            String token = request.getToken();
            if (!jwtService.isTokenValid(token)) {
                return new AuthResponse.Error("Invalid or expired registration token");
            }
            
            // Extract claims from token
            var claims = jwtService.extractAllClaims(token);
            String tokenType = claims.get("type", String.class);
            String provider = claims.get("provider", String.class);
            String email = claims.get("oauth_email", String.class);
            String name = claims.get("oauth_name", String.class);
            String picture = claims.get("oauth_picture", String.class);
            
            if (!"oauth_registration".equals(tokenType)) {
                return new AuthResponse.Error("Invalid registration token type");
            }
            
            // Check if user already exists (shouldn't happen, but safety check)
            if (userRepository.existsByEmail(email)) {
                return new AuthResponse.Error("Email already registered");
            }
            
            // Check if phone already exists (if provided)
            if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty() && 
                userRepository.existsByPhone(request.getPhoneNumber())) {
                return new AuthResponse.Error("Phone number already registered");
            }
            
            // Validate role
            User.Role userRole;
            try {
                userRole = User.Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException e) {
                return new AuthResponse.Error("Invalid role. Must be USER or RESPONDER");
            }
            
            // Create new user
            User user = new User();
            user.setEmail(email);
            user.setFullName(name != null ? name : "");
            user.setPasswordHash(""); // OAuth users don't need passwords
            user.setPhone(request.getPhoneNumber());
            user.setOauthProvider(provider);
            user.setProfilePicture(picture);
            user.setIsVerified(true); // OAuth users are pre-verified
            user.setRole(userRole);
            
            // Parse date of birth
            if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
                try {
                    user.setDateOfBirth(LocalDate.parse(request.getDateOfBirth()));
                } catch (Exception e) {
                    return new AuthResponse.Error("Invalid date format. Use YYYY-MM-DD");
                }
            }
            
            userRepository.save(user);
            
            // Create responder profile if role is RESPONDER
            if (userRole == User.Role.RESPONDER) {
                // Validate responder-specific fields
                if (request.getResponderType() == null || request.getResponderType().isEmpty()) {
                    return new AuthResponse.Error("Responder type is required for responder role");
                }
                if (request.getBadgeNumber() == null || request.getBadgeNumber().isEmpty()) {
                    return new AuthResponse.Error("Badge number is required for responder role");
                }
                
                // Validate responder type
                Responder.ResponderType responderType;
                try {
                    responderType = Responder.ResponderType.valueOf(request.getResponderType().toUpperCase());
                } catch (IllegalArgumentException e) {
                    return new AuthResponse.Error("Invalid responder type");
                }
                
                // Create responder profile
                Responder responder = new Responder();
                responder.setUser(user);
                responder.setResponderType(responderType);
                responder.setBadgeNumber(request.getBadgeNumber());
                responder.setIsActive(true);
                
                responderRepository.save(responder);
            }
            
            // Send welcome email
            try {
                emailService.sendWelcomeEmailForOAuth(email, name, provider);
            } catch (Exception e) {
                // Log error but don't fail registration
                System.err.println("Failed to send welcome email: " + e.getMessage());
            }
            
            return new AuthResponse.Success("Registration completed successfully! You can now sign in.");
            
        } catch (Exception e) {
            System.err.println("Error completing OAuth registration: " + e.getMessage());
            e.printStackTrace();
            return new AuthResponse.Error("Failed to complete registration. Please try again.");
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
    
    @Transactional(rollbackFor = Exception.class)
    public Object deleteAccount(AuthRequest.DeleteAccount request, String currentUserEmail) {
        try {
            // Find the user
            Optional<User> userOpt = userRepository.findByEmail(currentUserEmail);
            if (userOpt.isEmpty()) {
                return new AuthResponse.Error("User not found");
            }
            
            User user = userOpt.get();
            
            // Check confirmation text
            if (!"DELETE MY ACCOUNT".equals(request.getConfirmationText())) {
                return new AuthResponse.Error("Confirmation text must be exactly 'DELETE MY ACCOUNT'");
            }
            
            // For OAuth users (Google), skip password verification
            if (user.getOauthProvider() == null || user.getOauthProvider().isEmpty()) {
                // Regular user - verify password
                if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                    return new AuthResponse.Error("Invalid password");
                }
            }
            // OAuth users don't need password verification
            
            // Delete associated responder record if exists
            if (user.getRole() == User.Role.RESPONDER) {
                responderRepository.deleteByUserId(user.getId());
            }
            
            // Delete the user account
            userRepository.delete(user);
            
            // Send account deletion confirmation email
            try {
                emailService.sendAccountDeletionConfirmation(user.getEmail(), user.getFullName());
            } catch (Exception e) {
                // Log error but don't fail the deletion
                System.err.println("Failed to send account deletion confirmation email: " + e.getMessage());
            }
            
            return new AuthResponse.Success("Account deleted successfully");
            
        } catch (Exception e) {
            System.err.println("Error deleting account: " + e.getMessage());
            e.printStackTrace();
            return new AuthResponse.Error("Failed to delete account. Please try again.");
        }
    }
}
