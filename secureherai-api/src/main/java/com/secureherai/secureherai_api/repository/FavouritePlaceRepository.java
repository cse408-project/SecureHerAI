package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.FavouritePlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavouritePlaceRepository extends JpaRepository<FavouritePlace, UUID> {
    
    // Find favourite_place by user ID
    List<FavouritePlace> findByUserId(UUID userId);
    
    // Find favourite_place by ID and user ID (for authorization)
    Optional<FavouritePlace> findByIdAndUserId(UUID id, UUID userId);

    Optional<FavouritePlace> findByUserIdAndPlaceName(UUID userId, String placeName);

    void deleteById(UUID id);

    long countByUserId(UUID userId);
}
