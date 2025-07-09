package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.config.TestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(HealthController.class)
@Import(TestSecurityConfig.class)
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void isOkEndpoint_returnsHealthyStatus() throws Exception {
        mockMvc.perform(get("/api/isOk"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$.status").value("healthy"))
                .andExpect(jsonPath("$.service").value("SecureHerAI API"))
                .andExpect(jsonPath("$.timestamp").exists());
    }
}
