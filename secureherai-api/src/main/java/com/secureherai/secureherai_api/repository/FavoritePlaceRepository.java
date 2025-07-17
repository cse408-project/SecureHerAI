package com.secureherai.secureherai_api.repository;

import com.secureherai.secureherai_api.entity.FavoritePlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoritePlaceRepository extends JpaRepository<FavoritePlace, UUID> {
    
  
    List<FavoritePlace> findByUserId(UUID userId);
    Optional<FavoritePlace> findByUserIdAndId(UUID userId, UUID id);
    Optional<FavoritePlace> findByUserIdAndPlaceName(UUID userId , String placeName);
    

}
