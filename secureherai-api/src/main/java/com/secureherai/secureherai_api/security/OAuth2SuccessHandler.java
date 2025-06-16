package com.secureherai.secureherai_api.security;

import com.secureherai.secureherai_api.service.OAuthService;
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

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final Logger LOGGER = Logger.getLogger(OAuth2SuccessHandler.class.getName());

    @Autowired
    private OAuthService oAuthService;
    
    @Value("${app.frontend.url:http://localhost:8081}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, 
                                       Authentication authentication) throws IOException, ServletException {
        
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        
        // Process OAuth login and get JWT token
        String token = oAuthService.processOAuth2Login(oAuth2User, "GOOGLE");
        
        // Get user agent to determine if this is mobile or web
        String userAgent = request.getHeader("User-Agent");
        LOGGER.info("OAuth login success for user agent: " + userAgent);
        
        // Construct the success URL with the JWT token
        String redirectUrl;
        
        // Check if this is from a mobile device
        // This is a basic check - in production you might want to use a more sophisticated detection
        // or add a specific parameter from your mobile app to indicate mobile origin
        if (userAgent != null && (
            userAgent.contains("Android") || 
            userAgent.contains("iPhone") || 
            userAgent.contains("iPad") || 
            request.getParameter("platform") != null
        )) {
            // Use mobile redirect with deep linking
            redirectUrl = "/api/auth/mobile/oauth-success?token=" + token;
            LOGGER.info("Using mobile redirect: " + redirectUrl);
        } else {
            // Use web redirect - direct to web handler
            redirectUrl = "/api/auth/mobile/web-redirect?token=" + token;
            LOGGER.info("Using web redirect: " + redirectUrl);
        }
        
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
