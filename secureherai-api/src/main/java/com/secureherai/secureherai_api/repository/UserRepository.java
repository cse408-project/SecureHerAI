package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findByResetToken(String resetToken);
    Optional<User> findByLoginCode(String loginCode);
    
    // Now that isVerified is properly mapped to database, we can use it
    @Modifying
    @Transactional
    int deleteByIsVerifiedFalseAndCreatedAtBefore(LocalDateTime date);
}
