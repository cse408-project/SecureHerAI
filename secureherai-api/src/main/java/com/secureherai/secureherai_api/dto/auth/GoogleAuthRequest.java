package com.secureherai.secureherai_api.dto.auth;

import lombok.Data;

public class GoogleAuthRequest {
    
    @Data
    public static class GoogleLoginRequest {
        private String idToken;
    }

    @Data
    public static class GoogleLoginResponse {
        private boolean success;
        private String token;
        private String userId;
        private String fullName;
        private String role;
        private String message;
    }
}
