package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Settings entity
 */
@Repository
public interface SettingsRepository extends JpaRepository<Settings, UUID> {
    
    /**
     * Find settings by user ID
     * @param userId The user ID
     * @return Optional containing settings if found
     */
    Optional<Settings> findByUserId(UUID userId);
    
    /**
     * Check if settings exist for a user
     * @param userId The user ID
     * @return true if settings exist, false otherwise
     */
    boolean existsByUserId(UUID userId);
    
    /**
     * Delete settings by user ID
     * @param userId The user ID
     */
    @Modifying
    @Transactional
    void deleteByUserId(UUID userId);
}
