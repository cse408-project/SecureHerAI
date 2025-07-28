package com.secureherai.secureherai_api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${firebase.config.path:firebase-service-account.json}")
    private String firebaseConfigPath;

    @Value("${firebase.project.id:herai-f6be1}")
    private String projectId;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount;
                
                try {
                    // Try to load from classpath first
                    serviceAccount = new ClassPathResource(firebaseConfigPath).getInputStream();
                    log.info("Loading Firebase configuration from classpath: {}", firebaseConfigPath);
                } catch (Exception e) {
                    log.warn("Could not load Firebase config from classpath, trying file system path: {}", firebaseConfigPath);
                    try {
                        serviceAccount = new FileInputStream(firebaseConfigPath);
                    } catch (Exception ex) {
                        log.warn("Could not load Firebase config from file system. Using default credentials.");
                        serviceAccount = null;
                    }
                }

                FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                        .setProjectId(projectId);

                if (serviceAccount != null) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                    optionsBuilder.setCredentials(credentials);
                    serviceAccount.close();
                } else {
                    // Use default credentials (for deployment environments)
                    optionsBuilder.setCredentials(GoogleCredentials.getApplicationDefault());
                }

                FirebaseOptions options = optionsBuilder.build();
                FirebaseApp.initializeApp(options);
                
                log.info("Firebase initialized successfully for project: {}", projectId);
            } else {
                log.info("Firebase already initialized");
            }
        } catch (IOException e) {
            log.error("Failed to initialize Firebase", e);
            // Don't throw exception to allow app to start without Firebase
            // FCM features will be disabled but app will still work
        }
    }

    @Bean
    public FirebaseMessaging firebaseMessaging() {
        try {
            return FirebaseMessaging.getInstance();
        } catch (Exception e) {
            log.error("Failed to get FirebaseMessaging instance", e);
            return null;
        }
    }
}
