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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
        
        try {
            OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            
            LOGGER.info("Starting OAuth authentication success handler");
            
            // Process OAuth login and get JWT token
            String token = oAuthService.processOAuth2Login(oAuth2User, "GOOGLE");
            
            // Get user information from OAuth2User
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String picture = oAuth2User.getAttribute("picture");
            
            LOGGER.info("OAuth login success for user: " + email);
            
            // Build redirect URL with properly encoded parameters
            StringBuilder redirectUrlBuilder = new StringBuilder(frontendUrl + "/oauth-success");
            redirectUrlBuilder.append("?");
            
            if (token != null && !token.isEmpty()) {
                redirectUrlBuilder.append("token=").append(URLEncoder.encode(token, StandardCharsets.UTF_8));
            }
            
            if (email != null && !email.isEmpty()) {
                if (redirectUrlBuilder.charAt(redirectUrlBuilder.length() - 1) != '?') {
                    redirectUrlBuilder.append("&");
                }
                redirectUrlBuilder.append("email=").append(URLEncoder.encode(email, StandardCharsets.UTF_8));
            }
            
            if (name != null && !name.isEmpty()) {
                if (redirectUrlBuilder.charAt(redirectUrlBuilder.length() - 1) != '?') {
                    redirectUrlBuilder.append("&");
                }
                redirectUrlBuilder.append("name=").append(URLEncoder.encode(name, StandardCharsets.UTF_8));
            }
            
            if (picture != null && !picture.isEmpty()) {
                if (redirectUrlBuilder.charAt(redirectUrlBuilder.length() - 1) != '?') {
                    redirectUrlBuilder.append("&");
                }
                redirectUrlBuilder.append("picture=").append(URLEncoder.encode(picture, StandardCharsets.UTF_8));
            }
            
            String redirectUrl = redirectUrlBuilder.toString();
            
            LOGGER.info("Redirecting to frontend: " + redirectUrl);
            
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            
        } catch (Exception e) {
            LOGGER.severe("Error in OAuth authentication success handler: " + e.getMessage());
            e.printStackTrace();
            
            // Redirect to frontend error page
            String errorUrl = frontendUrl + "/oauth-error?error=" + URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
}
