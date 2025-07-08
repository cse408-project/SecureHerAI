package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(GoogleAuthController.class)
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = {
    "spring.security.oauth2.client.registration.google.client-id=test-google-client-id"
})
class GoogleAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    private String testToken;

    @BeforeEach
    void setUp() {
        testToken = "test.google.jwt.token";
    }

    @Test
    void getLoginUrl_ReturnsGoogleOAuthUrl() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/google/login"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.url").value("/oauth2/authorize/google"));
    }

    @Test
    void redirectToApp_ValidToken_RedirectsToDeepLink() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/google/redirect")
                .param("token", testToken))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureherai://auth?token=" + testToken));
    }

    @Test
    void redirectToApp_EmptyToken_RedirectsWithEmptyToken() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/google/redirect")
                .param("token", ""))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureherai://auth?token="));
    }

    @Test
    void redirectToApp_NoTokenParam_RedirectsWithNull() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/google/redirect"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureherai://auth?token=null"));
    }

    @Test
    void redirectToApp_TokenWithSpecialCharacters_HandlesCorrectly() throws Exception {
        // Arrange
        String specialToken = "token.with%special&chars=google";

        // Act & Assert
        mockMvc.perform(get("/api/auth/google/redirect")
                .param("token", specialToken))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureherai://auth?token=" + specialToken));
    }

    @Test
    void getLoginUrl_AlwaysReturnsConsistentResponse() throws Exception {
        // Test multiple calls to ensure consistency
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(get("/api/auth/google/login"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.url").value("/oauth2/authorize/google"));
        }
    }
}
