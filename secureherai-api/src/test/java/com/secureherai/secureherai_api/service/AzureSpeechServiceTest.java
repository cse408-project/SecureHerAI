package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.service.AzureSpeechService.SpeechTranscriptionResult;
import com.secureherai.secureherai_api.util.AudioFormatConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AzureSpeechServiceTest {

    @Mock
    private AudioFormatConverter audioConverter;

    @InjectMocks
    private AzureSpeechService azureSpeechService;

    private File testAudioFile;
    private final String testAudioUrl = "https://example.com/audio.wav";

    @BeforeEach
    void setUp() {
        // Set up Azure configuration using reflection
        ReflectionTestUtils.setField(azureSpeechService, "speechKey", "test-speech-key");
        ReflectionTestUtils.setField(azureSpeechService, "speechRegion", "test-region");

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
        List<String> result = azureSpeechService.getSupportedAudioFormats();

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
        boolean result = azureSpeechService.isAudioFormatSupported(fileName);

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
        boolean result = azureSpeechService.isAudioFormatSupported(fileName);

        // Assert
        assertFalse(result);
        verify(audioConverter).isSupportedByExtension(fileName);
    }

    @Test
    void transcribeAudioFile_NullAzureKey_ThrowsIllegalStateException() {
        // Arrange
        ReflectionTestUtils.setField(azureSpeechService, "speechKey", null);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Azure Speech key is not configured"));
    }

    @Test
    void transcribeAudioFile_EmptyAzureKey_ThrowsIllegalStateException() {
        // Arrange
        ReflectionTestUtils.setField(azureSpeechService, "speechKey", "  ");

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Azure Speech key is not configured"));
    }

    @Test
    void transcribeAudioFile_NullAzureRegion_ThrowsIllegalStateException() {
        // Arrange
        ReflectionTestUtils.setField(azureSpeechService, "speechRegion", null);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Azure Speech region is not configured"));
    }

    @Test
    void transcribeAudioFile_EmptyAzureRegion_ThrowsIllegalStateException() {
        // Arrange
        ReflectionTestUtils.setField(azureSpeechService, "speechRegion", "  ");

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Azure Speech region is not configured"));
    }

    @Test
    void transcribeAudioFile_FileDoesNotExist_ThrowsIllegalArgumentException() {
        // Arrange
        when(testAudioFile.exists()).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Audio file does not exist or is empty"));
    }

    @Test
    void transcribeAudioFile_EmptyFile_ThrowsIllegalArgumentException() {
        // Arrange
        when(testAudioFile.length()).thenReturn(0L);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Audio file does not exist or is empty"));
    }

    @Test
    void transcribeAudioFile_UnsupportedFormat_ThrowsUnsupportedOperationException() {
        // Arrange
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(false);
        when(audioConverter.getSupportedFormats()).thenReturn(Arrays.asList("WAV", "MP3", "AAC"));

        // Act & Assert
        UnsupportedOperationException exception = assertThrows(UnsupportedOperationException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertTrue(exception.getMessage().contains("Unsupported audio format"));
        assertTrue(exception.getMessage().contains("WAV, MP3, AAC"));
    }

    @Test
    void transcribeAudioFromUrl_EmptyUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                azureSpeechService.transcribeAudioFromUrl("", "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    @Test
    void transcribeAudioFromUrl_NullUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                azureSpeechService.transcribeAudioFromUrl(null, "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    @Test
    void transcribeAudioFromUrl_WhitespaceUrl_ThrowsIllegalArgumentException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                azureSpeechService.transcribeAudioFromUrl("   ", "en-US"));
        
        assertEquals("Audio URL cannot be empty", exception.getMessage());
    }

    @Test
    void transcribeAudioFromUrl_InvalidAzureConfig_ThrowsIllegalStateException() {
        // Arrange
        ReflectionTestUtils.setField(azureSpeechService, "speechKey", null);

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
                azureSpeechService.transcribeAudioFromUrl(testAudioUrl, "en-US"));
        
        assertTrue(exception.getMessage().contains("Azure Speech key is not configured"));
    }

    @Test
    void speechTranscriptionResult_DefaultConstructor_CreatesEmptyResult() {
        // Act
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();

        // Assert
        assertFalse(result.isSuccess()); // default boolean is false
        assertNull(result.getText());
        assertEquals(0.0, result.getConfidence());
        assertNull(result.getMessage());
    }

    @Test
    void speechTranscriptionResult_ParameterizedConstructor_SetsAllFields() {
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
    }

    @Test
    void speechTranscriptionResult_Setters_UpdateFields() {
        // Arrange
        SpeechTranscriptionResult result = new SpeechTranscriptionResult();

        // Act
        result.setSuccess(true);
        result.setText("Test text");
        result.setConfidence(0.87);
        result.setMessage("Test message");

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Test text", result.getText());
        assertEquals(0.87, result.getConfidence());
        assertEquals("Test message", result.getMessage());
    }

    @Test
    void transcribeAudioFile_AudioConverterException_PropagatesException() throws Exception {
        // Arrange
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(true);
        when(audioConverter.convertToWav(testAudioFile))
                .thenThrow(new IOException("Audio conversion failed"));

        // Act & Assert
        IOException exception = assertThrows(IOException.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        assertEquals("Audio conversion failed", exception.getMessage());
        verify(audioConverter).convertToWav(testAudioFile);
    }

    @Test
    void transcribeAudioFile_CleanupTempFile_CallsCleanupWhenFileCreated() throws Exception {
        // Arrange
        File convertedFile = mock(File.class);
        when(convertedFile.getAbsolutePath()).thenReturn("/test/converted.wav");
        
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(true);
        when(audioConverter.convertToWav(testAudioFile)).thenReturn(convertedFile);
        
        // The service will try to call Azure Speech API, but we can't easily mock that
        // So we expect an exception, but verify cleanup is called
        doNothing().when(audioConverter).cleanupTempFile(convertedFile);

        // Act & Assert
        assertThrows(Exception.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        // Verify cleanup was called for the converted file (different from original)
        verify(audioConverter).cleanupTempFile(convertedFile);
    }

    @Test
    void transcribeAudioFile_NoCleanupWhenSameFile_DoesNotCallCleanup() throws Exception {
        // Arrange - when converter returns the same file (no conversion needed)
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(true);
        when(audioConverter.convertToWav(testAudioFile)).thenReturn(testAudioFile);

        // Act & Assert
        assertThrows(Exception.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        // Verify cleanup was NOT called since it's the same file
        verify(audioConverter, never()).cleanupTempFile(testAudioFile);
    }

    @Test
    void transcribeAudioFile_ValidInputConfiguration_CallsAudioConverter() throws Exception {
        // Arrange
        when(audioConverter.isSupportedByExtension(testAudioFile.getName())).thenReturn(true);
        when(audioConverter.convertToWav(testAudioFile)).thenReturn(testAudioFile);

        // Act & Assert
        // This will fail at Azure API call since we can't mock it easily, but that's expected
        assertThrows(Exception.class, () ->
                azureSpeechService.transcribeAudioFile(testAudioFile));
        
        // Verify the flow got to audio conversion
        verify(audioConverter).isSupportedByExtension(testAudioFile.getName());
        verify(audioConverter).convertToWav(testAudioFile);
    }
}
