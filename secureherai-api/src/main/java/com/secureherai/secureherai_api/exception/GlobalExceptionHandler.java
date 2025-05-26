package com.secureherai.secureherai_api.exception;

import com.secureherai.secureherai_api.dto.auth.AuthResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Object> handleDataIntegrityViolation(DataIntegrityViolationException e) {
        String message = e.getMessage();
        if (message.contains("value too long")) {
            return ResponseEntity.badRequest()
                .body(new AuthResponse.Error("Data is too large for the field. Please use smaller values."));
        } else if (message.contains("duplicate key") || message.contains("already exists")) {
            return ResponseEntity.badRequest()
                .body(new AuthResponse.Error("Email or phone number already exists"));
        } else {
            return ResponseEntity.badRequest()
                .body(new AuthResponse.Error("Invalid data provided"));
        }
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Object> handleDataAccessException(DataAccessException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new AuthResponse.Error("Database error occurred"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException e) {
        StringBuilder errorMessage = new StringBuilder("Validation failed: ");
        e.getBindingResult().getFieldErrors().forEach(error -> 
            errorMessage.append(error.getField()).append(" ").append(error.getDefaultMessage()).append("; ")
        );
        return ResponseEntity.badRequest()
            .body(new AuthResponse.Error(errorMessage.toString()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Object> handleTypeMismatchException(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
            .body(new AuthResponse.Error("Invalid parameter type: " + e.getName()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGenericException(Exception e) {
        System.err.println("Unexpected error: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new AuthResponse.Error("An unexpected error occurred"));
    }
}
