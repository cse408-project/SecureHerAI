package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.service.AzureSpeechService.SpeechTranscriptionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SOSServiceTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private AzureSpeechService azureSpeechService;

    @InjectMocks
    private SOSService sosService;

    private UUID testUserId;
    private LocationDto locationDto;
    private MultipartFile mockAudioFile;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        
        // Setup location data
        locationDto = new LocationDto();
        locationDto.setLatitude(BigDecimal.valueOf(23.8103));
        locationDto.setLongitude(BigDecimal.valueOf(90.4125));
        locationDto.setAddress("Dhaka, Bangladesh");
        
        // Mock audio file
        mockAudioFile = new MockMultipartFile(
            "audioFile",
            "test-audio.wav",
            "audio/wav",
            "dummy audio content".getBytes()
        );
    }

    @Test
    void processTextCommand_WithHelpKeyword_CreatesAlert() throws Exception {
        // Arrange
        String message = "I need assistance";
        String keyword = "help";
        
        // We need to capture what's actually saved to the repository
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> {
            Alert alert = invocation.getArgument(0);
            alert.setId(UUID.randomUUID());
            return alert;
        });

        // Act
        Alert result = sosService.processTextCommand(testUserId, message, keyword, locationDto);

        // Assert
        assertNotNull(result);
        assertEquals(message, result.getAlertMessage());
        assertEquals("text", result.getTriggerMethod());
        assertEquals(testUserId, result.getUserId());
        assertEquals(locationDto.getLatitude(), result.getLatitude());
        assertEquals(locationDto.getLongitude(), result.getLongitude());
        assertEquals(locationDto.getAddress(), result.getAddress());
        
        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void processTextCommand_WithNonHelpKeyword_ReturnsNull() throws Exception {
        // Arrange
        String message = "Just checking in";
        String keyword = "test";

        // Act
        Alert result = sosService.processTextCommand(testUserId, message, keyword, locationDto);

        // Assert
        assertNull(result);
        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processVoiceCommand_WithEmergencyKeyword_CreatesAlert() throws Exception {
        // Arrange
        String transcribedText = "I need help! Emergency!";
        SpeechTranscriptionResult transcriptionResult = new SpeechTranscriptionResult(true, transcribedText, 0.9, "Success");
        
        Alert savedAlert = new Alert();
        savedAlert.setId(UUID.randomUUID());
        savedAlert.setUserId(testUserId);
        savedAlert.setAlertMessage(transcribedText);
        savedAlert.setTriggerMethod("voice");
        savedAlert.setStatus("active");
        
        when(azureSpeechService.transcribeAudioFile(any(File.class))).thenReturn(transcriptionResult);
        when(alertRepository.save(any(Alert.class))).thenReturn(savedAlert);

        // Act
        Alert result = sosService.processVoiceCommand(testUserId, mockAudioFile, locationDto);

        // Assert
        assertNotNull(result);
        assertEquals(transcribedText, result.getAlertMessage());
        assertEquals("voice", result.getTriggerMethod());
        assertEquals(testUserId, result.getUserId());
        
        verify(azureSpeechService).transcribeAudioFile(any(File.class));
        verify(alertRepository).save(any(Alert.class));
    }

    @Test
    void processVoiceCommand_TranscriptionFailed_ReturnsNull() throws Exception {
        // Arrange
        SpeechTranscriptionResult failedTranscription = new SpeechTranscriptionResult(false, "", 0.0, "Transcription failed");
        
        when(azureSpeechService.transcribeAudioFile(any(File.class))).thenReturn(failedTranscription);

        // Act
        Alert result = sosService.processVoiceCommand(testUserId, mockAudioFile, locationDto);

        // Assert
        assertNull(result);
        
        verify(azureSpeechService).transcribeAudioFile(any(File.class));
        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void processVoiceCommand_NoKeywordDetected_ReturnsNull() throws Exception {
        // Arrange
        // Make sure the text doesn't contain any of the default keywords: "help", "emergency", "sos"
        String transcribedText = "This is a normal message without any trigger phrases";
        SpeechTranscriptionResult transcriptionResult = new SpeechTranscriptionResult(true, transcribedText, 0.9, "Success");
        
        when(azureSpeechService.transcribeAudioFile(any(File.class))).thenReturn(transcriptionResult);
        
        // The key is not to mock the alertRepository.save here to let the real flow run
        
        // Act
        Alert result = sosService.processVoiceCommand(testUserId, mockAudioFile, locationDto);

        // Assert
        assertNull(result);
        
        verify(azureSpeechService).transcribeAudioFile(any(File.class));
        // Verify that save was never called since no keywords were detected
        verify(alertRepository, never()).save(any(Alert.class));
    }
    
    @Test
    void getUserAlerts_ReturnsUserAlerts() {
        // Arrange
        Alert alert1 = new Alert();
        alert1.setId(UUID.randomUUID());
        alert1.setUserId(testUserId);
        
        Alert alert2 = new Alert();
        alert2.setId(UUID.randomUUID());
        alert2.setUserId(testUserId);
        
        List<Alert> expectedAlerts = Arrays.asList(alert1, alert2);
        
        when(alertRepository.findByUserId(testUserId)).thenReturn(expectedAlerts);
        
        // Act
        List<Alert> result = sosService.getUserAlerts(testUserId);
        
        // Assert
        assertEquals(2, result.size());
        assertEquals(expectedAlerts, result);
        verify(alertRepository).findByUserId(testUserId);
    }
    
    @Test
    void getActiveAlerts_ReturnsActiveAlerts() {
        // Arrange
        Alert alert1 = new Alert();
        alert1.setId(UUID.randomUUID());
        alert1.setStatus("active");
        
        Alert alert2 = new Alert();
        alert2.setId(UUID.randomUUID());
        alert2.setStatus("active");
        
        List<Alert> expectedAlerts = Arrays.asList(alert1, alert2);
        
        when(alertRepository.findActiveAlerts()).thenReturn(expectedAlerts);
        
        // Act
        List<Alert> result = sosService.getActiveAlerts();
        
        // Assert
        assertEquals(2, result.size());
        assertEquals(expectedAlerts, result);
        verify(alertRepository).findActiveAlerts();
    }
    
    @Test
    void cancelAlert_ValidAlert_ReturnsUpdatedAlert() {
        // Arrange
        UUID alertId = UUID.randomUUID();
        
        Alert alert = new Alert();
        alert.setId(alertId);
        alert.setUserId(testUserId);
        alert.setStatus("active");
        
        Alert updatedAlert = new Alert();
        updatedAlert.setId(alertId);
        updatedAlert.setUserId(testUserId);
        updatedAlert.setStatus("canceled");
        
        when(alertRepository.findById(alertId)).thenReturn(java.util.Optional.of(alert));
        when(alertRepository.save(any(Alert.class))).thenReturn(updatedAlert);
        
        // Act
        Alert result = sosService.cancelAlert(alertId, testUserId);
        
        // Assert
        assertNotNull(result);
        assertEquals("canceled", result.getStatus());
        verify(alertRepository).findById(alertId);
        verify(alertRepository).save(any(Alert.class));
    }
    
    @Test
    void cancelAlert_AlertNotFound_ReturnsNull() {
        // Arrange
        UUID alertId = UUID.randomUUID();
        
        when(alertRepository.findById(alertId)).thenReturn(java.util.Optional.empty());
        
        // Act
        Alert result = sosService.cancelAlert(alertId, testUserId);
        
        // Assert
        assertNull(result);
        verify(alertRepository).findById(alertId);
        verify(alertRepository, never()).save(any(Alert.class));
    }
    
    @Test
    void cancelAlert_UnauthorizedUser_ReturnsNull() {
        // Arrange
        UUID alertId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        
        Alert alert = new Alert();
        alert.setId(alertId);
        alert.setUserId(otherUserId); // Different user
        alert.setStatus("active");
        
        when(alertRepository.findById(alertId)).thenReturn(java.util.Optional.of(alert));
        
        // Act
        Alert result = sosService.cancelAlert(alertId, testUserId);
        
        // Assert
        assertNull(result);
        verify(alertRepository).findById(alertId);
        verify(alertRepository, never()).save(any(Alert.class));
    }
    
    @Test
    void cancelAlert_AlreadyCanceled_ReturnsNull() {
        // Arrange
        UUID alertId = UUID.randomUUID();
        
        Alert alert = new Alert();
        alert.setId(alertId);
        alert.setUserId(testUserId);
        alert.setStatus("canceled"); // Already canceled
        
        when(alertRepository.findById(alertId)).thenReturn(java.util.Optional.of(alert));
        
        // Act
        Alert result = sosService.cancelAlert(alertId, testUserId);
        
        // Assert
        assertNull(result);
        verify(alertRepository).findById(alertId);
        verify(alertRepository, never()).save(any(Alert.class));
    }
}
