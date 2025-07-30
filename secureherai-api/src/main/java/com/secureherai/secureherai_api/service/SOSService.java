package com.secureherai.secureherai_api.service;

import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.entity.Alert;
import com.secureherai.secureherai_api.entity.AlertResponder;
import com.secureherai.secureherai_api.entity.IncidentReport;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.entity.Responder;
import com.secureherai.secureherai_api.enums.AlertStatus;
import com.secureherai.secureherai_api.repository.AlertRepository;
import com.secureherai.secureherai_api.repository.AlertResponderRepository;
import com.secureherai.secureherai_api.repository.UserRepository;
import com.secureherai.secureherai_api.repository.ResponderRepository;
import com.secureherai.secureherai_api.service.AzureSpeechService.SpeechTranscriptionResult;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final AlertResponderRepository alertResponderRepository;
    private final UserRepository userRepository;
    private final ResponderRepository responderRepository;
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
            cleanupTemporaryFile(tempFile);
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
            alert.setTriggeredAt(LocalDateTime.now());
            
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
                alert.setTriggeredAt(LocalDateTime.now());
                
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
    public List<Alert> getAllAlerts() {
        log.info("Getting all active alerts for responders");
        return alertRepository.findAllAlerts();
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
        if (!alert.getStatus().equals(AlertStatus.ACTIVE)) {
            log.warn("Alert {} is already {}, cannot cancel", alertId, alert.getStatus());
            return null;
        }
        
        // Update alert status and set canceled time
        alert.setStatus(AlertStatus.CANCELED);
        alert.setCanceledAt(LocalDateTime.now());
        
        // Save and return the updated alert
        return alertRepository.save(alert);
    }
    
    /**
     * Get participant location for navigation
     * For Users: returns responder's location  
     * For Responders: returns user's location
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAlertParticipantLocation(UUID alertId, UUID requesterId) {
        log.info("Getting participant location for alert: {} by user: {}", alertId, requesterId);
        
        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (!alertOpt.isPresent()) {
            throw new RuntimeException("Alert not found with ID: " + alertId);
        }
        
        Alert alert = alertOpt.get();
        
        // Get the user who created the alert
        Optional<User> userOpt = userRepository.findById(alert.getUserId());
        if (!userOpt.isPresent()) {
            throw new RuntimeException("Alert user not found");
        }
        User alertUser = userOpt.get();
        
        // Check if requester is the alert user
        boolean isUser = alert.getUserId().equals(requesterId);
        
        // Check if requester is a responder for this alert
        Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, requesterId);
        boolean isResponder = alertResponderOpt.isPresent();
        
        if (!isUser && !isResponder) {
            throw new RuntimeException("User is not authorized to access this alert's participant location");
        }
        
        Map<String, Object> result = new HashMap<>();
        
        if (isUser) {
            // User is requesting responder's location
            // Find ANY responder for this alert
            List<AlertResponder> alertResponders = alertResponderRepository.findByAlertId(alertId);
            if (alertResponders.isEmpty()) {
                throw new RuntimeException("No responder assigned to this alert yet");
            }
            
            // Get the first accepted responder
            AlertResponder acceptedResponder = alertResponders.stream()
                .filter(ar -> AlertStatus.ACCEPTED.equals(ar.getStatus()) || 
                             AlertStatus.EN_ROUTE.equals(ar.getStatus()) || 
                             AlertStatus.ARRIVED.equals(ar.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active responder found for this alert"));
            
            Optional<Responder> responderOpt = responderRepository.findById(acceptedResponder.getResponderId());
            if (!responderOpt.isPresent()) {
                throw new RuntimeException("Responder not found");
            }
            Responder responder = responderOpt.get();
            
            result.put("success", true);
            
            Map<String, Object> participantLocation = new HashMap<>();
            participantLocation.put("latitude", responder.getUser().getCurrentLatitude());
            participantLocation.put("longitude", responder.getUser().getCurrentLongitude());
            participantLocation.put("lastUpdate", responder.getUser().getLastLocationUpdate());
            result.put("participantLocation", participantLocation);
            
            Map<String, Object> participantInfo = new HashMap<>();
            participantInfo.put("name", responder.getUser().getFullName());
            participantInfo.put("role", "RESPONDER");
            participantInfo.put("responderType", responder.getResponderType().toString());
            participantInfo.put("badgeNumber", responder.getBadgeNumber());
            
            // Add contact information
            participantInfo.put("phone", responder.getUser().getPhone());
            participantInfo.put("email", responder.getUser().getEmail());
            participantInfo.put("profilePicture", responder.getUser().getProfilePicture());
            
            result.put("participantInfo", participantInfo);
        } else {
            // Responder is requesting user's location
            result.put("success", true);
            
            Map<String, Object> participantLocation = new HashMap<>();
            participantLocation.put("latitude", alertUser.getCurrentLatitude());
            participantLocation.put("longitude", alertUser.getCurrentLongitude());
            participantLocation.put("lastUpdate", alertUser.getLastLocationUpdate());
            result.put("participantLocation", participantLocation);
            
            Map<String, Object> participantInfo = new HashMap<>();
            participantInfo.put("name", alertUser.getFullName());
            participantInfo.put("role", "USER");
            
            // Add contact information
            participantInfo.put("phone", alertUser.getPhone());
            participantInfo.put("email", alertUser.getEmail());
            participantInfo.put("profilePicture", alertUser.getProfilePicture());
            
            result.put("participantInfo", participantInfo);
        }
        
        return result;
    }
    
    /**
     * Update alert status by responder (resolved, critical, false)
     * 
     * @param alertId The alert ID to update
     * @param responderId The responder ID making the update
     * @param newStatus The new status for the alert
     * @param notes Optional notes about the status update
     * @return The updated alert or null if not found/unauthorized
     */
    @Transactional
    public Alert updateAlertStatus(UUID alertId, UUID responderId, String newStatus, String notes) {
        log.info("Updating alert {} to status {} by responder {}", alertId, newStatus, responderId);
        
        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            return null;
        }
        
        Alert alert = alertOpt.get();
        
        // Verify this responder is assigned to the alert
        Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);
        if (alertResponderOpt.isEmpty()) {
            log.warn("Responder {} is not assigned to alert {}", responderId, alertId);
            return null;
        }
        
        // Valid status transitions for responders
        List<AlertStatus> validStatuses = Arrays.asList(AlertStatus.RESOLVED, AlertStatus.CRITICAL, AlertStatus.FALSE_ALARM, AlertStatus.REJECTED);
        AlertStatus statusEnum;
        try {
            statusEnum = AlertStatus.fromString(newStatus);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status: {}", newStatus);
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        
        if (!validStatuses.contains(statusEnum)) {
            log.warn("Invalid status for responder update: {}", newStatus);
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        
        // Update alert status
        alert.setStatus(statusEnum);
        
        // If resolving the alert, set resolved time
        if (AlertStatus.RESOLVED.equals(statusEnum)) {
            alert.setResolvedAt(LocalDateTime.now());
        }
        
        // Add notes if provided
        if (notes != null && !notes.trim().isEmpty()) {
            AlertResponder alertResponder = alertResponderOpt.get();
            alertResponder.setNotes(notes);
            alertResponderRepository.save(alertResponder);
        }
        
        // Save and return the updated alert
        Alert updatedAlert = alertRepository.save(alert);

         // Find the AlertResponder record
        // Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, responderId);
        
        // if (alertResponderOpt.isEmpty()) {
        //     return ResponseEntity.status(HttpStatus.NOT_FOUND).body(createErrorResponse("Alert not found or not assigned to you"));
        // }

        AlertResponder alertResponder = alertResponderOpt.get();
        // AlertStatus statusEnum = AlertStatus.fromString(newStatus);
        alertResponder.setStatus(statusEnum);
        
        // Set arrival time if status is "arrived"
        if (AlertStatus.RESOLVED.equals(statusEnum)) {
            alertResponder.setArrivalTime(java.time.LocalDateTime.now());
        }
        
        alertResponderRepository.save(alertResponder);
        
        // Notify the user about the status change
        try {
            // TODO: Implement sendAlertStatusUpdate method
            // notificationService.sendAlertStatusUpdate(updatedAlert.getUserId(), alertId, statusEnum.getValue(), responderId);
            log.info("Alert status updated to {} for alert {}", statusEnum.getValue(), alertId);
        } catch (Exception e) {
            log.error("Error sending notification for alert status update", e);
        }
        
        return updatedAlert;
    }
    
    /**
     * Get alert details including responder information if available
     * 
     * @param alertId The alert ID to retrieve
     * @param userId The user ID requesting the details (for authorization)
     * @return Map containing alert details and responder info if available
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getAlertDetails(UUID alertId, UUID userId) {
        log.info("Getting alert details for alertId: {} requested by userId: {}", alertId, userId);
        
        Map<String, Object> result = new HashMap<>();
        
        // Find the alert
        Optional<Alert> alertOpt = alertRepository.findById(alertId);
        if (alertOpt.isEmpty()) {
            log.warn("Alert not found: {}", alertId);
            result.put("success", false);
            result.put("error", "Alert not found");
            return result;
        }
        
        Alert alert = alertOpt.get();
        
        // Check authorization - must be either the alert creator or an assigned responder
        boolean isAuthorized = alert.getUserId().equals(userId);
        
        if (!isAuthorized) {
            // Check if user is a responder for this alert
            Optional<AlertResponder> alertResponderOpt = alertResponderRepository.findByAlertIdAndResponderId(alertId, userId);
            isAuthorized = alertResponderOpt.isPresent();
        }
        
        if (!isAuthorized) {
            log.warn("User {} is not authorized to view alert {}", userId, alertId);
            result.put("success", false);
            result.put("error", "Not authorized to view this alert");
            return result;
        }
        
        // Basic alert details
        result.put("success", true);
        result.put("alert", alert);
        
        // If there are responders assigned, include their information
        List<AlertResponder> alertResponders = alertResponderRepository.findByAlertId(alertId);
        if (!alertResponders.isEmpty()) {
            List<Map<String, Object>> responderInfoList = new java.util.ArrayList<>();
            
            for (AlertResponder alertResponder : alertResponders) {
                Optional<Responder> responderOpt = responderRepository.findById(alertResponder.getResponderId());
                if (responderOpt.isPresent()) {
                    Responder responder = responderOpt.get();
                    User responderUser = responder.getUser();
                    
                    Map<String, Object> responderInfo = new HashMap<>();
                    responderInfo.put("responderId", responder.getUserId());
                    responderInfo.put("name", responderUser.getFullName());
                    responderInfo.put("phone", responderUser.getPhone());
                    responderInfo.put("email", responderUser.getEmail());
                    responderInfo.put("profilePicture", responderUser.getProfilePicture());
                    responderInfo.put("responderType", responder.getResponderType().toString());
                    responderInfo.put("badgeNumber", responder.getBadgeNumber());
                    responderInfo.put("status", alertResponder.getStatus());
                    responderInfo.put("acceptedAt", alertResponder.getAcceptedAt());
                    responderInfo.put("notes", alertResponder.getNotes());
                    
                    responderInfoList.add(responderInfo);
                }
            }
            
            result.put("responders", responderInfoList);
        }
        
        return result;
    }

    /**
     * Scheduled cleanup task to remove old temporary SOS files every 30 minutes
     * Cleans up files older than 30 minutes in SOS temp directory
     */
    @Scheduled(fixedRate = 1800000) // Run every 30 minutes (1800000 ms)
    public void cleanupOldSOSTempFiles() {
        log.debug("Starting scheduled cleanup of old SOS temporary audio files");
        
        try {
            Path tempDir = Path.of("data/temp");
            if (!Files.exists(tempDir)) {
                return;
            }

            long cutoffTime = System.currentTimeMillis() - 1800000; // 30 minutes
            
            Files.list(tempDir)
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().startsWith("temp_sos_"))
                .filter(path -> {
                    try {
                        return Files.getLastModifiedTime(path).toMillis() < cutoffTime;
                    } catch (IOException e) {
                        log.warn("Failed to get last modified time for SOS temp file: {}", path, e);
                        return false;
                    }
                })
                .forEach(path -> {
                    try {
                        Files.delete(path);
                        log.debug("Cleaned up old SOS temporary file: {}", path);
                    } catch (IOException e) {
                        log.warn("Failed to delete old SOS temporary file: {}", path, e);
                    }
                });
                
        } catch (IOException e) {
            log.warn("Failed to cleanup SOS temp directory: {}", e.getMessage());
        }
    }
}
