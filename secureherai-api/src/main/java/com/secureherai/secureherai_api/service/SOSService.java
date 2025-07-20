package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.IncidentReport;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.service.AzureSpeechService.SpeechTranscriptionResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ExecutionException;
import java.time.LocalDateTime;

/**
 * Service for handling SOS alerts (voice and text-based)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SOSService {
    
    private final AlertRepository alertRepository;
    private final AzureSpeechService azureSpeechService;
    private final NotificationService notificationService;
    private final SettingsService settingsService;
    private final ReportService reportService;
    
    // Default SOS keywords
    private static final List<String> DEFAULT_KEYWORDS = Arrays.asList("help", "emergency", "sos");
    
    // Directory for storing audio files
    private static final String SOS_AUDIO_DIR = "data/sos";
    
    /**
     * Process voice command and create an alert if a keyword is detected
     *
     * @param userId The user ID from authentication
     * @param audioFile The audio file containing the voice command
     * @param location Location information
     * @return The created alert or null if no keywords were detected
     */
    @Transactional
    public Alert processVoiceCommand(UUID userId, MultipartFile audioFile, LocationDto location) 
            throws IOException, InterruptedException, ExecutionException, Exception {
        
        log.info("Processing voice command for user: {}", userId);
        
        File tempFile = null;
        try {
            // Save the uploaded file temporarily
            tempFile = saveTemporaryFile(audioFile);
            
            // Transcribe the audio file
            SpeechTranscriptionResult transcriptionResult = azureSpeechService.transcribeAudioFile(tempFile);
            
            if (!transcriptionResult.isSuccess()) {
                log.warn("Transcription failed: {}", transcriptionResult.getMessage());
                return null;
            }
            
            String transcribedText = transcriptionResult.getText();
            log.info("Transcribed text: {}", transcribedText);
            
            // Check if any keywords are present in the transcribed text
            if (containsKeyword(transcribedText, userId)) {
                // Save the audio file to a persistent location
                String audioUrl = saveAudioFile(audioFile, userId);
                
                // Create alert
                Alert alert = new Alert();
                alert.setUserId(userId);
                alert.setLatitude(location.getLatitude());
                alert.setLongitude(location.getLongitude());
                alert.setAddress(location.getAddress());
                alert.setTriggerMethod("voice");
                alert.setAlertMessage(transcribedText);
                alert.setAudioRecording(audioUrl);
                
                // Save the alert
                Alert savedAlert = alertRepository.save(alert);
                
                // Auto-generate incident report for this alert
                try {
                    IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                    if (autoReport != null) {
                        log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
                }
                
                // Send notifications to trusted contacts and nearby responders
                notificationService.sendSOSAlertNotifications(savedAlert);
                
                return savedAlert;
            } else {
                log.info("No keywords detected in voice command");
                return null;
            }
        } finally {
            // Clean up the temporary file
            // cleanupTemporaryFile(tempFile);
        }
    }
    
    /**
     * Process voice command from URL and create an alert if a keyword is detected
     *
     * @param userId The user ID from authentication
     * @param audioUrl The URL of the audio file
     * @param location Location information
     * @return The created alert or null if no keywords were detected
     */
    @Transactional
    public Alert processVoiceCommandFromUrl(UUID userId, String audioUrl, LocationDto location) 
            throws IOException, InterruptedException, ExecutionException, Exception {
        
        log.info("Processing voice command from URL for user: {}", userId);
        
        // Transcribe the audio from URL
        SpeechTranscriptionResult transcriptionResult = azureSpeechService.transcribeAudioFromUrl(audioUrl, null);
        
        if (!transcriptionResult.isSuccess()) {
            log.warn("URL transcription failed: {}", transcriptionResult.getMessage());
            return null;
        }
        
        String transcribedText = transcriptionResult.getText();
        log.info("Transcribed text from URL: {}", transcribedText);
        
        // Check if any default keywords are present in the transcribed text
        if (containsKeyword(transcribedText, userId)) {
            // Create alert
            Alert alert = new Alert();
            alert.setUserId(userId);
            alert.setLatitude(location.getLatitude());
            alert.setLongitude(location.getLongitude());
            alert.setAddress(location.getAddress());
            alert.setTriggerMethod("voice");
            alert.setAlertMessage(transcribedText);
            alert.setAudioRecording(audioUrl); // Use the provided URL directly
            
            // Save the alert
            Alert savedAlert = alertRepository.save(alert);
            
            // Auto-generate incident report for this alert
            try {
                IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                if (autoReport != null) {
                    log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                }
            } catch (Exception e) {
                log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
            }
            
            // Send notifications to trusted contacts and nearby responders
            notificationService.sendSOSAlertNotifications(savedAlert);
            
            return savedAlert;
        } else {
            log.info("No keywords detected in voice command from URL");
            return null;
        }
    }
    
    /**
     * Process text command and create an alert if the provided keyword matches user's SOS keyword
     *
     * @param userId The user ID from authentication
     * @param message The text message
     * @param keyword The keyword to check
     * @param location Location information
     * @return The created alert or null if the keyword doesn't match
     */
    @Transactional
    public Alert processTextCommand(UUID userId, String message, String keyword, LocationDto location) {
        
        log.info("Processing text command for user: {}", userId);
        
        try {
            // Get user's custom SOS keyword
            String userSosKeyword = settingsService.getSosKeyword(userId);
            
            // Check if the provided keyword matches the user's SOS keyword (case-insensitive)
            if (keyword != null && keyword.toLowerCase().equals(userSosKeyword.toLowerCase())) {
                // Create alert
                Alert alert = new Alert();
                alert.setUserId(userId);
                alert.setLatitude(location.getLatitude());
                alert.setLongitude(location.getLongitude());
                alert.setAddress(location.getAddress());
                alert.setTriggerMethod("text");
                alert.setAlertMessage(message);
                
                // Save the alert
                Alert savedAlert = alertRepository.save(alert);
                
                // Auto-generate incident report for this alert
                try {
                    IncidentReport autoReport = reportService.autoGenerateReportFromAlert(savedAlert);
                    if (autoReport != null) {
                        log.info("Auto-generated incident report for alert: {}", savedAlert.getId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to auto-generate report for alert {}: {}", savedAlert.getId(), e.getMessage());
                }
                
                // Send notifications to trusted contacts and nearby responders
                notificationService.sendSOSAlertNotifications(savedAlert);
                
                return savedAlert;
            } else {
                log.info("Keyword '{}' does not match user's SOS keyword '{}' in text command", keyword, userSosKeyword);
                return null;
            }
        } catch (Exception e) {
            log.error("Error processing text command for user: {}", userId, e);
            return null;
        }
    }
    
    /**
     * Check if text contains any of the default keywords or user's custom keyword
     *
     * @param text The text to check
     * @param userId The user ID to get custom keyword
     * @return True if any keyword is found, false otherwise
     */
    private boolean containsKeyword(String text, UUID userId) {
        if (text == null || text.isEmpty()) {
            return false;
        }
        
        String lowercaseText = text.toLowerCase();
        
        // Check default keywords
        boolean hasDefaultKeyword = DEFAULT_KEYWORDS.stream().anyMatch(lowercaseText::contains);
        
        // Check user's custom keyword
        try {
            String userKeyword = settingsService.getSosKeyword(userId);
            boolean hasUserKeyword = userKeyword != null && lowercaseText.contains(userKeyword.toLowerCase());
            
            return hasDefaultKeyword || hasUserKeyword;
        } catch (Exception e) {
            log.warn("Error getting user's SOS keyword for user: {}, using default keywords only", userId, e);
            return hasDefaultKeyword;
        }
    }
    
    /**
     * Saves audio file to persistent storage
     *
     * @param audioFile The audio file
     * @param userId User ID for file naming
     * @return The relative URL to the saved file
     */
    private String saveAudioFile(MultipartFile audioFile, UUID userId) throws IOException {
        // Create directory if it doesn't exist
        Path sosDir = Paths.get(SOS_AUDIO_DIR);
        if (!Files.exists(sosDir)) {
            Files.createDirectories(sosDir);
        }

        // Generate filename with user ID and timestamp
        String originalFileName = audioFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = String.format("sos_voice_%s_%d%s", 
                userId.toString(),
                System.currentTimeMillis(),
                fileExtension);

        Path filePath = sosDir.resolve(uniqueFileName);
        
        // Copy uploaded file to persistent storage
        Files.copy(audioFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        log.info("Saved SOS audio file: {}", filePath.toAbsolutePath());
        
        // Return relative path/URL to the file
        return SOS_AUDIO_DIR + "/" + uniqueFileName;
    }
    
    /**
     * Saves the uploaded file to a temporary location
     *
     * @param audioFile The uploaded file
     * @return The temporary file
     */
    private File saveTemporaryFile(MultipartFile audioFile) throws IOException {
        // Create temporary directory if it doesn't exist
        Path tempDir = Paths.get("data/temp");
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }

        // Generate unique filename
        String originalFileName = audioFile.getOriginalFilename();
        String fileExtension = getFileExtension(originalFileName);
        String uniqueFileName = String.format("temp_sos_%d_%s%s", 
            System.currentTimeMillis(),
            Thread.currentThread().getId(),
            fileExtension
        );

        Path tempFilePath = tempDir.resolve(uniqueFileName);
        
        // Copy uploaded file to temporary location
        Files.copy(audioFile.getInputStream(), tempFilePath, StandardCopyOption.REPLACE_EXISTING);
        
        File tempFile = tempFilePath.toFile();
        log.debug("Saved temporary file: {}", tempFile.getAbsolutePath());
        
        return tempFile;
    }
    
    /**
     * Cleans up the temporary file
     *
     * @param tempFile The temporary file to delete
     */
    private void cleanupTemporaryFile(File tempFile) {
        if (tempFile != null && tempFile.exists()) {
            try {
                if (tempFile.delete()) {
                    log.debug("Deleted temporary file: {}", tempFile.getAbsolutePath());
                } else {
                    log.warn("Failed to delete temporary file: {}", tempFile.getAbsolutePath());
                }
            } catch (Exception e) {
                log.warn("Error deleting temporary file: {}", tempFile.getAbsolutePath(), e);
            }
        }
    }
    
    /**
     * Extract file extension from filename
     *
     * @param fileName The filename
     * @return The file extension including the dot
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return ".wav";  // Default extension
        }
        
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex);
        }
        
        return ".wav";  // Default extension
    }
    
    /**
     * Get all alerts for a specific user
     * 
     * @param userId The user ID
     * @return List of user's alerts
     */
    public List<Alert> getUserAlerts(UUID userId) {
        log.info("Getting all alerts for user: {}", userId);
        return alertRepository.findByUserId(userId);
    }
    
    /**
     * Get all active alerts (for responders)
     * 
     * @return List of all active alerts
     */
    public List<Alert> getActiveAlerts() {
        log.info("Getting all active alerts for responders");
        return alertRepository.findActiveAlerts();
    }
    
    /**
     * Cancel an alert
     * 
     * @param alertId The alert ID
     * @param userId The user ID (for authorization)
     * @return The updated alert or null if not found or unauthorized
     */
    @Transactional
    public Alert cancelAlert(UUID alertId, UUID userId) {
        log.info("Canceling alert with ID: {} for user: {}", alertId, userId);
        
        // Find the alert and check if user is authorized
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        
        if (alertOpt.isEmpty()) {
            log.warn("Alert with ID: {} not found", alertId);
            return null;
        }
        
        Alert alert = alertOpt.get();
        
        // Check if the user owns this alert
        if (!alert.getUserId().equals(userId)) {
            log.warn("User {} is not authorized to cancel alert {}", userId, alertId);
            return null;
        }
        
        // Check if the alert is already canceled or resolved
        if (!alert.getStatus().equals("active")) {
            log.warn("Alert {} is already {}, cannot cancel", alertId, alert.getStatus());
            return null;
        }
        
        // Update alert status and set canceled time
        alert.setStatus("canceled");
        alert.setCanceledAt(LocalDateTime.now());
        
        // Save and return the updated alert
        return alertRepository.save(alert);
    }
}
