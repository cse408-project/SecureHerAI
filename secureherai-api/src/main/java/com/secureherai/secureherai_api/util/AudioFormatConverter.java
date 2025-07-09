package com.secureherai.secureherai_api.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.stereotype.Component;
import ws.schild.jave.Encoder;
import ws.schild.jave.MultimediaObject;
import ws.schild.jave.encode.AudioAttributes;
import ws.schild.jave.encode.EncodingAttributes;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;

/**
 * Utility class for converting various audio formats to WAV format
 * compatible with Azure Speech-to-Text service
 */
@Component
@Slf4j
public class AudioFormatConverter {

    private static final List<String> SUPPORTED_INPUT_FORMATS = Arrays.asList(
        "audio/mpeg", "audio/mp3",                                     // MP3
        "audio/mp4", "audio/aac", "audio/x-aac",                      // AAC (all variants)
        "audio/webm", "video/webm",                                    // WebM (both audio and video containers)
        "audio/wav", "audio/wave", "audio/vnd.wave", "audio/x-wav",   // WAV (all variants)
        "audio/ogg", "audio/opus",                                     // OGG/Opus
        "audio/flac",                                                  // FLAC
        "audio/x-ms-wma"                                               // WMA
    );

    private static final String TEMP_DIR = "data/temp";
    private final Tika tika = new Tika();

    /**
     * Converts an audio file to WAV format suitable for Azure Speech service
     * 
     * @param inputFile The input audio file
     * @return File object pointing to the converted WAV file
     * @throws IOException If file operations fail
     * @throws Exception If audio conversion fails
     */
    public File convertToWav(File inputFile) throws IOException, Exception {
        if (inputFile == null || !inputFile.exists()) {
            throw new IllegalArgumentException("Input file does not exist or is null");
        }

        // Create temp directory if it doesn't exist
        Path tempDir = Paths.get(TEMP_DIR);
        if (!Files.exists(tempDir)) {
            Files.createDirectories(tempDir);
        }

        // Detect file format
        String mimeType = detectAudioFormat(inputFile);
        log.info("Detected audio format: {} for file: {}", mimeType, inputFile.getName());

        // Check if format is supported
        if (!isFormatSupported(mimeType)) {
            throw new UnsupportedOperationException("Unsupported audio format: " + mimeType);
        }

        // If already WAV, just copy to temp location for consistency
        if (isWavFormat(mimeType)) {
            log.info("File is already in WAV format, copying to temp location");
            return copyToTempLocation(inputFile);
        }

        // Convert to WAV
        return convertAudioToWav(inputFile, mimeType);
    }

    /**
     * Converts audio file from URL to WAV format
     * 
     * @param sourceFile The downloaded audio file
     * @param detectedFormat The detected MIME type of the audio
     * @return File object pointing to the converted WAV file
     * @throws Exception If conversion fails
     */
    public File convertUrlAudioToWav(File sourceFile, String detectedFormat) throws Exception {
        log.info("Converting URL audio to WAV. Detected format: {}", detectedFormat);
        
        if (!isFormatSupported(detectedFormat)) {
            throw new UnsupportedOperationException("Unsupported audio format: " + detectedFormat);
        }

        if (isWavFormat(detectedFormat)) {
            log.info("URL audio is already in WAV format");
            return sourceFile; // Already in correct format
        }

        return convertAudioToWav(sourceFile, detectedFormat);
    }

    /**
     * Detects the audio format of a file using Apache Tika
     */
    private String detectAudioFormat(File file) throws IOException {
        return tika.detect(file);
    }

    /**
     * Checks if the audio format is supported
     */
    private boolean isFormatSupported(String mimeType) {
        return SUPPORTED_INPUT_FORMATS.stream()
               .anyMatch(format -> mimeType.toLowerCase().contains(format.toLowerCase()));
    }

    /**
     * Checks if the format is already WAV
     */
    private boolean isWavFormat(String mimeType) {
        return mimeType.toLowerCase().contains("wav") || mimeType.toLowerCase().contains("wave");
    }

    /**
     * Copies file to temp location (for WAV files that don't need conversion)
     */
    private File copyToTempLocation(File inputFile) throws IOException {
        String tempFileName = "wav_" + System.currentTimeMillis() + "_" + inputFile.getName();
        File tempFile = Paths.get(TEMP_DIR, tempFileName).toFile();
        
        Files.copy(inputFile.toPath(), tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        
        log.debug("Copied WAV file to temp location: {}", tempFile.getAbsolutePath());
        return tempFile;
    }

    /**
     * Performs the actual audio conversion using JAVE2
     */
    private File convertAudioToWav(File inputFile, String mimeType) throws Exception {
        String tempFileName = "converted_" + System.currentTimeMillis() + "_" + 
                             getBaseName(inputFile.getName()) + ".wav";
        File outputFile = Paths.get(TEMP_DIR, tempFileName).toFile();

        try {
            // Set up audio attributes for WAV output compatible with Azure Speech
            AudioAttributes audioAttributes = new AudioAttributes();
            audioAttributes.setCodec("pcm_s16le");  // 16-bit PCM
            audioAttributes.setBitRate(256000);     // High quality bitrate
            audioAttributes.setChannels(1);         // Mono (required for Azure Speech)
            audioAttributes.setSamplingRate(16000); // 16kHz (optimal for Azure Speech)

            // Set up encoding attributes
            EncodingAttributes encodingAttributes = new EncodingAttributes();
            encodingAttributes.setOutputFormat("wav");
            encodingAttributes.setAudioAttributes(audioAttributes);

            // Perform conversion
            Encoder encoder = new Encoder();
            MultimediaObject source = new MultimediaObject(inputFile);
            
            log.info("Starting conversion from {} to WAV format", mimeType);
            encoder.encode(source, outputFile, encodingAttributes);
            log.info("Successfully converted {} to WAV: {}", inputFile.getName(), outputFile.getName());

            return outputFile;

        } catch (Exception e) {
            // Clean up output file if conversion failed
            if (outputFile.exists()) {
                outputFile.delete();
            }
            log.error("Audio conversion failed for file {}: {}", inputFile.getName(), e.getMessage(), e);
            throw new Exception("Failed to convert audio file: " + e.getMessage(), e);
        }
    }

    /**
     * Gets the base name of a file without extension
     */
    private String getBaseName(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    }

    /**
     * Cleans up temporary files
     */
    public void cleanupTempFile(File tempFile) {
        if (tempFile != null && tempFile.exists() && tempFile.getPath().contains(TEMP_DIR)) {
            try {
                Files.delete(tempFile.toPath());
                log.debug("Cleaned up temporary file: {}", tempFile.getName());
            } catch (IOException e) {
                log.warn("Failed to delete temporary file {}: {}", tempFile.getName(), e.getMessage());
            }
        }
    }

    /**
     * Gets information about supported audio formats
     */
    public List<String> getSupportedFormats() {
        return SUPPORTED_INPUT_FORMATS;
    }

    /**
     * Validates if an audio format is supported based on file extension
     */
    public boolean isSupportedByExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return false;
        }
        
        String extension = fileName.toLowerCase().substring(fileName.lastIndexOf(".") + 1);
        
        switch (extension) {
            case "mp3":
            case "aac":
            case "m4a":
            case "webm":
            case "wav":
            case "wave":
            case "ogg":
            case "opus":
            case "flac":
            case "wma":
                return true;
            default:
                return false;
        }
    }
}
