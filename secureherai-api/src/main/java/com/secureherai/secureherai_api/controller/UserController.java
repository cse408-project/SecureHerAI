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

import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private AuthService authService;
    
    @Autowired
    private JwtService jwtService;

    @GetMapping("/profile")
    public ResponseEntity<Object> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse.Error("Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            Object response = authService.getProfile(userId);
            
            if (response instanceof AuthResponse.Error) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (io.jsonwebtoken.JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse.Error("Invalid or expired authentication token"));
        } catch (Exception e) {
            System.err.println("Unexpected error in getProfile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse.Error("An unexpected error occurred while retrieving profile"));
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Object> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody AuthRequest.UpdateProfile request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!jwtService.isTokenValid(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse.Error("Authentication token is invalid or expired"));
            }
            
            UUID userId = jwtService.extractUserId(token);
            Object response = authService.updateProfile(userId, request);
            
            if (response instanceof AuthResponse.Error) {
                return ResponseEntity.badRequest().body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Handle database constraint violations
            String message = e.getMessage();
            if (message.contains("value too long")) {
                return ResponseEntity.badRequest()
                    .body(new AuthResponse.Error("Profile picture data is too large. Please use a smaller image."));
            } else if (message.contains("duplicate key") || message.contains("already exists")) {
                return ResponseEntity.badRequest()
                    .body(new AuthResponse.Error("Email or phone number already exists"));
            } else {
                return ResponseEntity.badRequest()
                    .body(new AuthResponse.Error("Invalid data provided: " + message));
            }
        } catch (org.springframework.dao.DataAccessException e) {
            // Handle other database errors
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse.Error("Database error occurred while updating profile"));
        } catch (io.jsonwebtoken.JwtException e) {
            // Handle JWT specific errors
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AuthResponse.Error("Invalid or expired authentication token"));
        } catch (Exception e) {
            // Log the exception for debugging
            System.err.println("Unexpected error in updateProfile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new AuthResponse.Error("An unexpected error occurred while updating profile"));
        }
    }
}
