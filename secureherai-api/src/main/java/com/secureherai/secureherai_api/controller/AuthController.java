package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.dto.auth.AuthRequest;
import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import com.secureherai.secureherai_api.service.AuthService;
import com.secureherai.secureherai_api.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<Object> login(@Valid @RequestBody AuthRequest.Login request) {
        Object response = authService.login(request);
        
        if (response instanceof AuthResponse.Error) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Object> register(@Valid @RequestBody AuthRequest.Register request) {
        Object response = authService.register(request);
        
        if (response instanceof AuthResponse.Error) {
            AuthResponse.Error error = (AuthResponse.Error) response;
            if (error.getError().contains("already")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Object> forgotPassword(@Valid @RequestBody AuthRequest.ForgotPassword request) {
        Object response = authService.forgotPassword(request);
        
        if (response instanceof AuthResponse.Error) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Object> resetPassword(@Valid @RequestBody AuthRequest.ResetPassword request) {
        Object response = authService.resetPassword(request);
        
        if (response instanceof AuthResponse.Error) {
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login-code")
    public ResponseEntity<Object> verifyLoginCode(@Valid @RequestBody AuthRequest.VerifyLoginCode request) {
        Object response = authService.verifyLoginCode(request);
        
        if (response instanceof AuthResponse.Error) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/google")
    public ResponseEntity<Object> googleLogin() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("authUrl", "/oauth2/authorize/google");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/google-signup")
    public ResponseEntity<Object> googleSignup() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("authUrl", "/oauth2/authorize/google");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/complete-oauth-registration")
    public ResponseEntity<Object> completeOAuthRegistration(@Valid @RequestBody AuthRequest.CompleteOAuthRegistration request) {
        Object response = authService.completeOAuthRegistration(request);
        
        if (response instanceof AuthResponse.Error) {
            AuthResponse.Error error = (AuthResponse.Error) response;
            if (error.getError().contains("already")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            return ResponseEntity.badRequest().body(response);
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @PostMapping("/google/validate-token")
    public ResponseEntity<Object> validateGoogleToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(new AuthResponse.Error("Token is required"));
            }
            
            Object response = authService.validateGoogleToken(token);
            
            if (response instanceof AuthResponse.Error) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse.Error("Token validation failed"));
        }
    }
    
    @DeleteMapping("/delete-account")
    public ResponseEntity<Object> deleteAccount(@Valid @RequestBody AuthRequest.DeleteAccount request, 
                                               @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract JWT token from Authorization header
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String userEmail = jwtService.extractEmail(token);
            
            if (userEmail == null || !jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse.Error("Invalid or expired token"));
            }
            
            Object response = authService.deleteAccount(request, userEmail);
            
            if (response instanceof AuthResponse.Error) {
                AuthResponse.Error error = (AuthResponse.Error) response;
                if (error.getError().contains("password") || error.getError().contains("confirmation")) {
                    return ResponseEntity.badRequest().body(response);
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse.Error("Invalid authorization header"));
        }
    }
}
