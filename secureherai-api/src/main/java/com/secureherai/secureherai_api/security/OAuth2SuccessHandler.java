package com.secureherai.secureherai_api.security;

import com.secureherai.secureherai_api.service.OAuthService;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.util.logging.Logger;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final Logger LOGGER = Logger.getLogger(OAuth2SuccessHandler.class.getName());

    @Autowired
    private OAuthService oAuthService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                       Authentication authentication) throws IOException, ServletException {
        
        try {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            
            LOGGER.info("Starting OAuth authentication success handler");
            
            // Get user information from OAuth2User
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String picture = oAuth2User.getAttribute("picture");
            
            LOGGER.info("OAuth authentication for email: " + email);
            
            // Check if user exists
            Optional<User> existingUser = userRepository.findByEmail(email);
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                
                // Check if user was registered with OAuth (specifically Google)
                if ("GOOGLE".equals(user.getOauthProvider())) {
                    // Existing OAuth user - proceed with login and send JWT token with user info
                    String token = oAuthService.processOAuth2Login(oAuth2User, "GOOGLE");
                    redirectToOAuthSuccess(request, response, token);
                } else {
                    // User exists but was registered without OAuth - redirect to login with error
                    redirectToLoginWithError(request, response, "This email is already registered. Please sign in with your password instead.");
                }
            } else {
                // New user - redirect to complete registration with temp token containing Google info
                String tempToken = oAuthService.generateTempTokenForRegistration(oAuth2User, "GOOGLE");
                redirectToCompleteRegistration(request, response, tempToken);
            }
            
        } catch (Exception e) {
            LOGGER.severe("Error in OAuth authentication success handler: " + e.getMessage());
            e.printStackTrace();
            
            // Redirect to frontend error page
            String errorUrl = frontendUrl + "/oauth-error?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
    
    private void redirectToOAuthSuccess(HttpServletRequest request, HttpServletResponse response, String token) throws IOException {
        // Simple redirect with only the JWT token - frontend will handle user info from token
        String redirectUrl = frontendUrl + "/oauth-success?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
        LOGGER.info("Redirecting to OAuth success: " + redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
    
    private void redirectToCompleteRegistration(HttpServletRequest request, HttpServletResponse response, String tempToken) throws IOException {
        // Redirect with temp token containing all Google OAuth info
        String redirectUrl = frontendUrl + "/complete-register?token=" + URLEncoder.encode(tempToken, StandardCharsets.UTF_8);
        LOGGER.info("Redirecting to complete registration: " + redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
    
    private void redirectToLoginWithError(HttpServletRequest request, HttpServletResponse response, String errorMessage) throws IOException {
        String redirectUrl = frontendUrl + "/(auth)?error=" + URLEncoder.encode(errorMessage, StandardCharsets.UTF_8);
        LOGGER.info("Redirecting to login with error: " + redirectUrl);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
