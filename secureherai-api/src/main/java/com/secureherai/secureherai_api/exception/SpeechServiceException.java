package com.secureherai.secureherai_api.exception;

import lombok.Getter;

/**
 * Exception thrown for errors in the speech-to-text service
 */
@Getter
public class SpeechServiceException extends RuntimeException {
    
    private final String fileName;
    private final long processingTime;
    
    public SpeechServiceException(String message, String fileName, long processingTime) {
        super(message);
        this.fileName = fileName;
        this.processingTime = processingTime;
    }
    
    public SpeechServiceException(String message, Throwable cause, String fileName, long processingTime) {
        super(message, cause);
        this.fileName = fileName;
        this.processingTime = processingTime;
    }
}
