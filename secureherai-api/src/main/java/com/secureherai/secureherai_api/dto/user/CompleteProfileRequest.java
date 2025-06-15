package com.secureherai.secureherai_api.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CompleteProfileRequest {
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Phone number must be valid")
    private String phoneNumber;
    
    @NotNull(message = "Date of birth is required")
    private LocalDate dateOfBirth;
    
    // Role field for profile completion after OAuth login
    // @Pattern(regexp = "USER|RESPONDER|ADMIN", message = "Role must be USER, RESPONDER, or ADMIN")
    private String role;
    
    // Responder-specific fields, required only if role is RESPONDER
    // @Pattern(regexp = "^(POLICE|MEDICAL|FIRE|SECURITY|OTHER)$", message = "Responder type must be valid")
    private String responderType;
    
    // @Pattern(regexp = "^[A-Za-z0-9\\-]{3,20}$", message = "Badge number must be 3-20 alphanumeric characters")
    private String badgeNumber;
}
