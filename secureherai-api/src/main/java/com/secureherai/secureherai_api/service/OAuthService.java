package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class OAuthService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private EmailService emailService;

    /**
     * Process a user authenticated via OAuth2
     * @param oAuth2User OAuth2User object from Spring Security
     * @param provider OAuth provider (e.g., "GOOGLE")
     * @return JWT token for the user
     */
    public String processOAuth2Login(OAuth2User oAuth2User, String provider) {
        try {
            Map<String, Object> attributes = oAuth2User.getAttributes();
            String email = (String) attributes.get("email");
            String name = (String) attributes.get("name");
            
            if (email == null || email.isEmpty()) {
                throw new RuntimeException("Email not provided by OAuth provider");
            }
            
            Optional<User> existingUser = userRepository.findByEmail(email);
            User user;
            
            if (existingUser.isEmpty()) {
                // Create new user
                user = new User();
                user.setEmail(email);
                user.setFullName(name != null ? name : "");
                user.setPasswordHash(""); // OAuth users don't have passwords
                user.setOauthProvider(provider);
                user.setIsProfileComplete(false); // Mark as incomplete profile
                user.setIsVerified(true); // OAuth users are already verified through the provider
                userRepository.save(user);
                
                // Try to send welcome email, but don't fail if it doesn't work
                try {
                    emailService.sendWelcomeEmailForOAuth(email, name, provider);
                } catch (Exception e) {
                    System.err.println("Failed to send welcome email: " + e.getMessage());
                    // Continue without failing the whole process
                }
            } else {
                user = existingUser.get();
                // Update user if needed
                if (user.getOauthProvider() == null) {
                    user.setOauthProvider(provider);
                    userRepository.save(user);
                }
            }
            
            return jwtService.generateTokenWithProfileStatus(
                user.getId(), 
                user.getEmail(), 
                user.getRole().name(),
                user.getIsProfileComplete() != null ? user.getIsProfileComplete() : true
            );
        } catch (Exception e) {
            System.err.println("Error processing OAuth2 login: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to process OAuth2 login: " + e.getMessage());
        }
    }
}
