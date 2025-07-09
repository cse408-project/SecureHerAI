package com.secureherai.secureherai_api.controller;

import com.secureherai.secureherai_api.config.TestSecurityConfig;
import com.secureherai.secureherai_api.service.AzureSpeechService;
import com.secureherai.secureherai_api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SpeechController.class)
@Import(TestSecurityConfig.class)
class SpeechControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AzureSpeechService azureSpeechService;

    @MockBean
    private JwtService jwtService;

    private UUID testUserId;
    private String validToken;
    private AzureSpeechService.SpeechTranscriptionResult successResult;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        validToken = "valid.jwt.token";

        // Setup JWT validation
        when(jwtService.isTokenValid(validToken)).thenReturn(true);
        when(jwtService.extractUserId(validToken)).thenReturn(testUserId);

        // Setup successful transcription result
        successResult = new AzureSpeechService.SpeechTranscriptionResult(
                true, "This is a test transcription", 0.95, "Speech recognized successfully");
    }

    @Test
    void transcribeAudio_ValidAudioFile_ReturnsTranscription() throws Exception {
        // Arrange
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test.wav", "audio/wav", "test audio content".getBytes());
        
        when(azureSpeechService.transcribeAudioFile(any())).thenReturn(successResult);

        // Act & Assert
        mockMvc.perform(multipart("/api/speech/transcribe")
                .file(audioFile)
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.transcribedText").value("This is a test transcription"))
                .andExpect(jsonPath("$.confidence").value(0.95));

        verify(azureSpeechService).transcribeAudioFile(any());
    }


    @Test
    void transcribeAudio_NoFile_ReturnsBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(multipart("/api/speech/transcribe")
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("No audio file provided"));

        verify(azureSpeechService, never()).transcribeAudioFile(any());
    }

    @Test
    void transcribeAudio_EmptyFile_ReturnsBadRequest() throws Exception {
        // Arrange
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "empty.wav", "audio/wav", new byte[0]);

        // Act & Assert
        mockMvc.perform(multipart("/api/speech/transcribe")
                .file(audioFile)
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Audio file cannot be empty"));

        verify(azureSpeechService, never()).transcribeAudioFile(any());
    }





    @Test
    void transcribeAudio_ServiceException_ReturnsInternalServerError() throws Exception {
        // Arrange
        MockMultipartFile audioFile = new MockMultipartFile(
                "audio", "test.wav", "audio/wav", "test audio content".getBytes());
        
        when(azureSpeechService.transcribeAudioFile(any()))
                .thenThrow(new RuntimeException("Azure service error"));

        // Act & Assert
        mockMvc.perform(multipart("/api/speech/transcribe")
                .file(audioFile)
                .header("Authorization", "Bearer " + validToken))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Internal server error")));
    }

    @Test
    void healthCheck_ReturnsOk() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/speech/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Speech-to-Text service is running"));
    }
}
