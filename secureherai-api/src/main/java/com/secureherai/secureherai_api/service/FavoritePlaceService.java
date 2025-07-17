package com.secureherai.secureherai_api.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.secureherai.secureherai_api.dto.fav_place.*;

import com.secureherai.secureherai_api.entity.FavoritePlace;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.repository.FavoritePlaceRepository;
import com.secureherai.secureherai_api.repository.UserRepository;

@Service
@Transactional
public class FavoritePlaceService {

    @Autowired
    private FavoritePlaceRepository FavoritePlaceRepository;

    @Autowired
    private UserRepository userRepository;    
    public FavoritePlaceResponse.GenericResponse addFavoritePlace(UUID userId, FavoritePlaceRequest.AddPlaceInfo request) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Check if FavoritePlace with same phone already exists for this user
            Optional<FavoritePlace> existingFavoritePlace = FavoritePlaceRepository.findByUserIdAndPlaceName(userId, request.getplace_info().getPlaceName());
            if (existingFavoritePlace.isPresent()) {
                return new FavoritePlaceResponse.GenericResponse(false, null, "A FavoritePlace with this phone number already exists");
            }

            // Create new  FavoritePlace
            FavoritePlace FavoritePlace = new FavoritePlace(
                userId,
                request.getplace_info().getPlaceName(),
                request.getplace_info().getLongitude(),
                request.getplace_info().getLatitude(),
                request.getplace_info().getAddress(),
                request.getplace_info().getImg_url()
            );

            FavoritePlaceRepository.save(FavoritePlace);
              return new FavoritePlaceResponse.GenericResponse(true, " FavoritePlace added successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavoritePlaceResponse.GenericResponse(false, null, "An error occurred while adding the FavoritePlace: " + e.getMessage());
        }
    }

    public Object getFavoritePlaces(UUID userId) {        
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            List<FavoritePlace> FavoritePlaces = FavoritePlaceRepository.findByUserId(userId);
            
            List<FavoritePlaceResponse.FavoritePlaceInfo> FavoritePlaceInfoList = FavoritePlaces.stream()
                .map(FavoritePlace -> new FavoritePlaceResponse.FavoritePlaceInfo(
                    FavoritePlace.getId().toString(),
                    FavoritePlace.getPlaceName(),
                    FavoritePlace.getLongitude(),
                    FavoritePlace.getLatitude(),
                    FavoritePlace.getAddress(),
                    FavoritePlace.getImageUrl(),
                    FavoritePlace.getCreatedAt()
                ))
                .collect(Collectors.toList());            
                return new FavoritePlaceResponse.GetFavoritePlacesResponse(true, FavoritePlaceInfoList);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavoritePlaceResponse.GenericResponse(false, null, "An error occurred while retrieving FavoritePlaces: " + e.getMessage());
        }
    }

    public FavoritePlaceResponse.GenericResponse deleteFavoritePlace(UUID userId, UUID FavoritePlaceId) {
        try {            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }
          //findByUserIdAndId(UUID userId, UUID id)
            // Find the FavoritePlace and verify it belongs to the user
            Optional<FavoritePlace> FavoritePlaceOpt = FavoritePlaceRepository.findByUserIdAndId( userId,FavoritePlaceId);
            if (FavoritePlaceOpt.isEmpty()) {
                return new FavoritePlaceResponse.GenericResponse(false, null, "FavoritePlace not found or doesn't belong to this user");
            }

            FavoritePlaceRepository.delete(FavoritePlaceOpt.get());
              return new FavoritePlaceResponse.GenericResponse(true, " FavoritePlace deleted successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavoritePlaceResponse.GenericResponse(false, null, "An error occurred while deleting the FavoritePlace: " + e.getMessage());
        }
    }

    public FavoritePlaceResponse.GenericResponse updateFavoritePlace(UUID userId, FavoritePlaceRequest.UpdatePlaceInfo request) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Parse the FavoritePlaceId
            UUID FavoritePlaceId;
            try {
                FavoritePlaceId = UUID.fromString(request.getplace_id());
            } catch (IllegalArgumentException e) {
                return new FavoritePlaceResponse.GenericResponse(false, null, "Invalid FavoritePlace ID format");
            }

            // Find the FavoritePlace and verify it belongs to the user
            Optional<FavoritePlace> FavoritePlaceOpt = FavoritePlaceRepository.findByUserIdAndId( userId,FavoritePlaceId);
            if (FavoritePlaceOpt.isEmpty()) {
                return new FavoritePlaceResponse.GenericResponse(false, null, "FavoritePlace not found or doesn't belong to this user");
            }

            // Check if the new phone number conflicts with another FavoritePlace
            if (!FavoritePlaceOpt.get().getPlaceName().equals(request.getplace_info().getPlaceName())) {
                Optional<FavoritePlace> existingFavoritePlace = FavoritePlaceRepository.findByUserIdAndPlaceName(userId, request.getplace_info().getPlaceName());
                if (existingFavoritePlace.isPresent() && !existingFavoritePlace.get().getId().equals(FavoritePlaceId)) {
                    return new FavoritePlaceResponse.GenericResponse(false, null, "Another FavoritePlace with this phone number already exists");
                }
            }

            // Update the FavoritePlace
            FavoritePlace FavoritePlace = FavoritePlaceOpt.get();
            FavoritePlace.setPlaceName(request.getplace_info().getPlaceName());
            FavoritePlace.setAddress(request.getplace_info().getAddress());
            FavoritePlace.setImageUrl(request.getplace_info().getImg_url());
            FavoritePlace.setLongitude(request.getplace_info().getLongitude());
            FavoritePlace.setLatitude(request.getplace_info().getLatitude());

            FavoritePlaceRepository.save(FavoritePlace);
            return new FavoritePlaceResponse.GenericResponse(true, " FavoritePlace updated successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavoritePlaceResponse.GenericResponse(false, null, "An error occurred while updating the FavoritePlace: " + e.getMessage());
        }
    }

    public Object getOneFavoritePlace(UUID userId, UUID FavoritePlaceId) {
        try {            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }
          //findByUserIdAndId(UUID userId, UUID id)
            // Find the FavoritePlace and verify it belongs to the user
            Optional<FavoritePlace> FavoritePlaceOpt = FavoritePlaceRepository.findByUserIdAndId( userId,FavoritePlaceId);
            if (FavoritePlaceOpt.isEmpty()) {
                return new FavoritePlaceResponse.GenericResponse(false, null, "FavoritePlace not found or doesn't belong to this user");
            }

            FavoritePlace FavoritePlace= FavoritePlaceOpt.get();

           FavoritePlaceResponse.FavoritePlaceInfo fav = new FavoritePlaceResponse.FavoritePlaceInfo(
                    FavoritePlace.getId().toString(),
                    FavoritePlace.getPlaceName(),
                    FavoritePlace.getLongitude(),
                    FavoritePlace.getLatitude(),
                    FavoritePlace.getAddress(),
                    FavoritePlace.getImageUrl(),
                    FavoritePlace.getCreatedAt()
            );
            return new FavoritePlaceResponse.GetFavoritePlaceResponse(true, fav );
        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavoritePlaceResponse.GenericResponse(false, null, "An error occurred while deleting the FavoritePlace: " + e.getMessage());
        }
    }

}
