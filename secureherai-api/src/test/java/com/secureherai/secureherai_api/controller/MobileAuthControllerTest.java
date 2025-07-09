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

@WebMvcTest(MobileAuthController.class)
@Import(TestSecurityConfig.class)
@TestPropertySource(properties = {
    "app.mobile.redirect.scheme=secureheraiapp",
    "app.frontend.url=http://localhost:8081"
})
class MobileAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtService jwtService;

    private String testToken;

    @BeforeEach
    void setUp() {
        testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token";
    }

    @Test
    void handleMobileRedirect_ValidToken_RedirectsToMobileApp() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/oauth-success")
                .param("token", testToken))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureheraiapp://auth?token=" + testToken));
    }

    @Test
    void handleMobileRedirect_EmptyToken_RedirectsWithEmptyToken() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/oauth-success")
                .param("token", ""))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureheraiapp://auth?token="));
    }

    @Test
    void handleMobileRedirect_NoTokenParam_ReturnsInternalServerError() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/oauth-success"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void testMobileRedirect_ReturnsTestRedirectUrl() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/test-redirect"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("secureheraiapp://auth?token=")))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")));
    }

    @Test
    void handleMobileRedirect_SpecialCharactersInToken_HandlesCorrectly() throws Exception {
        // Arrange
        String tokenWithSpecialChars = "token.with%special&chars=test";

        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/oauth-success")
                .param("token", tokenWithSpecialChars))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", 
                    "secureheraiapp://auth?token=" + tokenWithSpecialChars));
    }

    @Test
    void handleMobileRedirect_LongToken_HandlesCorrectly() throws Exception {
        // Arrange
        String longToken = "a".repeat(500); // Very long token

        // Act & Assert
        mockMvc.perform(get("/api/auth/mobile/oauth-success")
                .param("token", longToken))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", "secureheraiapp://auth?token=" + longToken));
    }
}
