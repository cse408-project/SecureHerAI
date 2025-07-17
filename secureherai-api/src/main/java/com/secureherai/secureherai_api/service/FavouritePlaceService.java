package com.secureherai.secureherai_api.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.secureherai.secureherai_api.dto.favouritePlace.*;
import com.secureherai.secureherai_api.dto.sos.LocationDto;
import com.secureherai.secureherai_api.entity.FavouritePlace;
import com.secureherai.secureherai_api.entity.User;
import com.secureherai.secureherai_api.exception.AuthenticationException;
import com.secureherai.secureherai_api.repository.FavouritePlaceRepository;
import com.secureherai.secureherai_api.repository.UserRepository;

@Service
@Transactional
public class FavouritePlaceService {

    @Autowired
    private FavouritePlaceRepository favRepo;

    @Autowired
    private UserRepository userRepository;    
    
    public FavouritePlaceResponse.GenericResponse addFavouritePlace(UUID userId, FavouritePlaceRequest.AddFavouritePlace request) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Check if contact with same phone already exists for this user
            Optional<FavouritePlace> existingPlace = favRepo.findByUserIdAndPlaceName(userId, request.getFavouritePlace().getPlaceName());
            if (existingPlace.isPresent()) {
                return new FavouritePlaceResponse.GenericResponse(false, null, "A Place with this name already exists");
            }

            // Create new trusted contact
            FavouritePlace place = new FavouritePlace(
                userId,
                request.getFavouritePlace().getLocation().getLatitude(),
                request.getFavouritePlace().getLocation().getLongitude(),
                request.getFavouritePlace().getLocation().getAddress(),
                request.getFavouritePlace().getPlaceName(),
                request.getFavouritePlace().getImageUrl()
            );

            favRepo.save(place);
            return new FavouritePlaceResponse.GenericResponse(true, "Place added successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavouritePlaceResponse.GenericResponse(false, null, "An error occurred while adding the contact: " + e.getMessage());
        }
    }

    public Object getFavouritePlaces(UUID userId) {        
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            List<FavouritePlace> fav_places = favRepo.findByUserId(userId);

            
            List<FavouritePlaceResponse.FavouritePlaceInfo> place_list = fav_places.stream().map(place -> new FavouritePlaceResponse.FavouritePlaceInfo(
                    place.getId(),
                    place.getPlaceName(),
                    new LocationDto(place.getLatitude(), place.getLongitude(), place.getAddress()),
                    place.getImageUrl(),
                    place.getCreatedAt()
                ))
                .collect(Collectors.toList());            
                
                return new FavouritePlaceResponse.GetFavouritePlaceResponse(true, place_list);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavouritePlaceResponse.GenericResponse(false, null, "An error occurred while retrieving fav_places: " + e.getMessage());
        }
    }


    public Object getFavouritePlace(UUID userId, UUID favId) {        
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            Optional<FavouritePlace> place = favRepo.findByIdAndUserId(favId, userId);

            if (place.isEmpty()) {
                return new FavouritePlaceResponse.GenericResponse(false, null, "No Place with this name exists");
            }
            
            FavouritePlace actualPlace = place.get();
            FavouritePlaceResponse.FavouritePlaceInfo fav_place = new FavouritePlaceResponse.FavouritePlaceInfo(
                    favId,
                    actualPlace.getPlaceName(),
                    new LocationDto(actualPlace.getLatitude(), actualPlace.getLongitude(), actualPlace.getAddress()),
                    actualPlace.getImageUrl(),
                    actualPlace.getCreatedAt()
                );            
                
                return new FavouritePlaceResponse.GetOneFavouritePlaceResponse(true, fav_place);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavouritePlaceResponse.GenericResponse(false, null, "An error occurred while retrieving fav_places: " + e.getMessage());
        }
    }

    public FavouritePlaceResponse.GenericResponse deleteFavouritePlace(UUID userId, UUID favId) {
        try {            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Find the contact and verify it belongs to the user
            Optional<FavouritePlace> placeOpt = favRepo.findByIdAndUserId(favId, userId);
            if (placeOpt.isEmpty()) {
                return new FavouritePlaceResponse.GenericResponse(false, null, "Place not found or doesn't belong to this user");
            }

            favRepo.delete(placeOpt.get());
              return new FavouritePlaceResponse.GenericResponse(true, "Place deleted successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavouritePlaceResponse.GenericResponse(false, null, "An error occurred while deleting the contact: " + e.getMessage());
        }
    }

    public FavouritePlaceResponse.GenericResponse updateFavouritePlace(UUID userId, FavouritePlaceRequest.UpdateFavouritePlace request) {
        try {
            // Verify user exists
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                throw new AuthenticationException("Invalid authentication token - user not found");
            }

            // Parse the favId
            UUID favId;
            try {
                favId = UUID.fromString(request.getFavId());
            } catch (IllegalArgumentException e) {
                return new FavouritePlaceResponse.GenericResponse(false, null, "Invalid contact ID format");
            }

            // Find the contact and verify it belongs to the user
            Optional<FavouritePlace> placeOpt = favRepo.findByIdAndUserId(favId, userId);
            if (placeOpt.isEmpty()) {
                return new FavouritePlaceResponse.GenericResponse(false, null, "FavouritePlace not found or doesn't belong to this user");
            }

            // Check if the new phone number conflicts with another contact
            if (!placeOpt.get().getPlaceName().equals(request.getFavouritePlace().getPlaceName())) {
                Optional<FavouritePlace> existingFavouritePlace = favRepo.findByUserIdAndPlaceName(userId, request.getFavouritePlace().getPlaceName());
                if (existingFavouritePlace.isPresent() && !existingFavouritePlace.get().getId().equals(favId)) {
                    return new FavouritePlaceResponse.GenericResponse(false, null, "Another Place with this Name already exists");
                }
            }

            // Update the contact
            FavouritePlace contact = placeOpt.get();
            contact.setPlaceName(request.getFavouritePlace().getPlaceName());
            contact.setLatitude(request.getFavouritePlace().getLocation().getLatitude());
            contact.setLongitude(request.getFavouritePlace().getLocation().getLongitude());
            contact.setAddress(request.getFavouritePlace().getLocation().getAddress());
            contact.setImageUrl(request.getFavouritePlace().getImageUrl());

            favRepo.save(contact);
            return new FavouritePlaceResponse.GenericResponse(true, "Place updated successfully.", null);

        } catch (AuthenticationException e) {
            // Re-throw authentication exceptions to be handled by controller
            throw e;
        } catch (Exception e) {
            return new FavouritePlaceResponse.GenericResponse(false, null, "An error occurred while updating the place: " + e.getMessage());
        }
    }
}
