package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.TrustedContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrustedContactRepository extends JpaRepository<TrustedContact, UUID> {
    
    List<TrustedContact> findByUserIdOrderByCreatedAtDesc(UUID userId);
    
    List<TrustedContact> findByUserId(UUID userId);
    
    Optional<TrustedContact> findByIdAndUserId(UUID id, UUID userId);
    
    Optional<TrustedContact> findByUserIdAndPhone(UUID userId, String phone);
    
    boolean existsByUserIdAndPhone(UUID userId, String phone);
    
    void deleteByIdAndUserId(UUID id, UUID userId);
    
    long countByUserId(UUID userId);
}
