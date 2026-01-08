package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.service.GeminiSpeechService.SpeechTranscriptionResult;
import com.secureherai.secureherai_api.util.AudioFormatConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.io.File;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GeminiSpeechService
 * Tests audio transcription with emotion detection functionality
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GeminiSpeechServiceTest {

    @Mock
    private AudioFormatConverter audioConverter;

    @InjectMocks
    private GeminiSpeechService geminiSpeechService;

    private File testAudioFile;
    private final String testAudioUrl = "https://example.com/audio.wav";

    @BeforeEach
    void setUp() {
        // Create a mock file for testing
        testAudioFile = mock(File.class);
        when(testAudioFile.exists()).thenReturn(true);
        when(testAudioFile.length()).thenReturn(1024L);
        when(testAudioFile.getName()).thenReturn("test-audio.wav");
        when(testAudioFile.getAbsolutePath()).thenReturn("/test/path/test-audio.wav");
    }

    @Test
    void getSupportedAudioFormats_ReturnsFormatList() {
        // Arrange
        List<String> expectedFormats = Arrays.asList("audio/wav", "audio/mp3", "audio/aac");
        when(audioConverter.getSupportedFormats()).thenReturn(expectedFormats);

        // Act
        List<String> result = geminiSpeechService.getSupportedAudioFormats();

        // Assert
        assertEquals(expectedFormats, result);
        verify(audioConverter).getSupportedFormats();
    }

    @Test
    void isAudioFormatSupported_SupportedFormat_ReturnsTrue() {
        // Arrange
        String fileName = "test.wav";
        when(audioConverter.isSupportedByExtension(fileName)).thenReturn(true);

        // Act
        boolean result = geminiSpeechService.isAudioFormatSupported(fileName);

        // Assert
        assertTrue(result);
        verify(audioConverter).isSupportedByExtension(fileName);
    }

    @Test
    void isAudioFormatSupported_UnsupportedFormat_ReturnsFalse() {
        // Arrange
        String fileName = "test.xyz";
        when(audioConverter.isSupportedByExtension(fileName)).thenReturn(false);

        // Act
        boolean result = geminiSpeechService.isAudioFormatSupported(fileName);

        // Assert
        assertFalse(result);
        verify(audioConverter).isSupportedByExtension(fileName);
    }

    @Test
    void transcribeAudioFile_FileDoesNotExist_ThrowsIllegalArgumentException() {
        // Arrange
        when(testAudioFile.exists()).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                geminiSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Audio file does not exist or is empty"));
    }

    @Test
    void transcribeAudioFile_EmptyFile_ThrowsIllegalArgumentException() {
        // Arrange
        when(testAudioFile.length()).thenReturn(0L);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                geminiSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Audio file does not exist or is empty"));
    }

    @Test
    void transcribeAudioFile_UnsupportedFormat_ThrowsUnsupportedOperationException() {
        // Arrange
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(false);
        when(audioConverter.getSupportedFormats()).thenReturn(Arrays.asList("WAV", "MP3", "AAC"));

        // Act & Assert
        UnsupportedOperationException exception = assertThrows(UnsupportedOperationException.class, () ->
                geminiSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Unsupported audio format"));
        assertTrue(exception.getMessage().contains("WAV, MP3, AAC"));
    }

    @Test
    void transcribeAudioFromUrl_EmptyUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                geminiSpeechService.transcribeAudioFromUrl("", "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    @Test
    void transcribeAudioFromUrl_NullUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                geminiSpeechService.transcribeAudioFromUrl(null, "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    @Test
    void transcribeAudioFromUrl_WhitespaceUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                geminiSpeechService.transcribeAudioFromUrl("   ", "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    // ==================== SpeechTranscriptionResult Tests ====================

    @Test
    void speechTranscriptionResult_DefaultConstructor_CreatesEmptyResult() {
        // Act
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();

        // Assert
        assertFalse(result.isSuccess());
        assertNull(result.getText());
        assertEquals(0.0, result.getConfidence());
        assertNull(result.getMessage());
        assertNull(result.getEmotion());
        assertNull(result.getLanguage());
        assertNull(result.getLanguageCode());
        assertFalse(result.isUrgent());
        assertFalse(result.isDistressed());
        assertNull(result.getSummary());
    }

    @Test
    void speechTranscriptionResult_BasicConstructor_SetsRequiredFields() {
        // Arrange
        boolean success = true;
        String text = "Hello world";
        double confidence = 0.95;
        String message = "Recognition successful";

        // Act
        SpeechTranscriptionResult result = new SpeechTranscriptionResult(success, text, confidence, message);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals(text, result.getText());
        assertEquals(confidence, result.getConfidence());
        assertEquals(message, result.getMessage());
        assertEquals("neutral", result.getEmotion()); // Default emotion
    }

    @Test
    void speechTranscriptionResult_Setters_UpdateAllFields() {
        // Arrange
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();

        // Act
        result.setSuccess(true);
        result.setText("Test text");
        result.setConfidence(0.87);
        result.setMessage("Test message");
        result.setEmotion("happy");
        result.setLanguage("English");
        result.setLanguageCode("en-US");
        result.setUrgent(true);
        result.setDistressed(true);
        result.setSummary("A happy greeting");

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Test text", result.getText());
        assertEquals(0.87, result.getConfidence());
        assertEquals("Test message", result.getMessage());
        assertEquals("happy", result.getEmotion());
        assertEquals("English", result.getLanguage());
        assertEquals("en-US", result.getLanguageCode());
        assertTrue(result.isUrgent());
        assertTrue(result.isDistressed());
        assertEquals("A happy greeting", result.getSummary());
    }

    @Test
    void speechTranscriptionResult_EmotionValues_AcceptsAllValidEmotions() {
        // Test all valid emotion values
        String[] validEmotions = {"happy", "sad", "angry", "neutral", "fearful", "anxious"};
        
        for (String emotion : validEmotions) {
            SpeechTranscriptionResult result = new SpeechTranscriptionResult();
            result.setEmotion(emotion);
            assertEquals(emotion, result.getEmotion());
        }
    }

    @Test
    void speechTranscriptionResult_UrgencyAndDistress_CorrectlyDetected() {
        // Arrange
        SpeechTranscriptionResult urgentResult = new SpeechTranscriptionResult();
        urgentResult.setUrgent(true);
        urgentResult.setDistressed(false);

        SpeechTranscriptionResult distressedResult = new SpeechTranscriptionResult();
        distressedResult.setUrgent(false);
        distressedResult.setDistressed(true);

        // Assert
        assertTrue(urgentResult.isUrgent());
        assertFalse(urgentResult.isDistressed());
        
        assertFalse(distressedResult.isUrgent());
        assertTrue(distressedResult.isDistressed());
    }

    @Test
    void speechTranscriptionResult_LanguageDetection_StoresLanguageInfo() {
        // Arrange
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();
        
        // Act
        result.setLanguage("Spanish");
        result.setLanguageCode("es-ES");
        
        // Assert
        assertEquals("Spanish", result.getLanguage());
        assertEquals("es-ES", result.getLanguageCode());
    }

    @Test
    void speechTranscriptionResult_Summary_StoresSummary() {
        // Arrange
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();
        String summary = "A user requesting emergency help in distressed voice";
        
        // Act
        result.setSummary(summary);
        
        // Assert
        assertEquals(summary, result.getSummary());
    }
}
