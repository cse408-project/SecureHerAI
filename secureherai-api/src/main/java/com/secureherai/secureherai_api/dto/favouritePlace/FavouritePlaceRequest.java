package com.secureherai.secureherai_api.dto.favouritePlace;

import com.secureherai.secureherai_api.dto.sos.LocationDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class FavouritePlaceRequest {
    // Contact Info class (shared between Add and Update)
    public static class FavouritePlaceInfo {
        @NotBlank(message = "Place Name is required")
        private String placeName;

        @NotNull(message = "Location is required")
        @Valid
        private LocationDto location;

        @Size(max = 500, message = "image Url cannot exceed 500 characters")
        private String imageUrl; // URL to profile picture, not base64 data

        public String getPlaceName() {
            return this.placeName;
        }

        public void setPlaceName(String placeName) {
            this.placeName = placeName;
        }

        public LocationDto getLocation() {
            return this.location;
        }

        public void setLocation(LocationDto location) {
            this.location = location;
        }

        public String getImageUrl() {
            return this.imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }    
    }
    
    // Add Trusted Contact Request
    public static class AddFavouritePlace {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @Valid
        @NotNull(message = "Place information is required")
        private FavouritePlaceInfo favouritePlace;

        public String getUserId() {
            return this.userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public FavouritePlaceInfo getFavouritePlace() {
            return this.favouritePlace;
        }

        public void setFavouritePlace(FavouritePlaceInfo favouritePlace) {
            this.favouritePlace = favouritePlace;
        }
    }
    
    // Delete Trusted Contact Request
    public static class DeleteFavouritePlace {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "FavouritePlace ID is required")
        private String favId;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getFavId() { return favId; }
        public void setFavId(String favId) { this.favId = favId; }
    }

    // Delete Trusted Contact Request
    public static class GetFavouritePlace {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "Favourite Place ID is required")
        private String favId;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getFavId() { return favId; }
        public void setFavId(String favId) { this.favId = favId; }
    }
    
    // Update Trusted Contact Request
    public static class UpdateFavouritePlace {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "FavouritePlace ID is required")
        private String favId;
        
        @Valid
        @NotNull(message = "Place information is required")
        private FavouritePlaceInfo favouritePlace;

        public String getUserId() {
            return this.userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public FavouritePlaceInfo getFavouritePlace() {
            return this.favouritePlace;
        }

        public void setFavouritePlace(FavouritePlaceInfo favouritePlace) {
            this.favouritePlace = favouritePlace;
        }
        
        public String getFavId() { return favId; }
        public void setFavId(String favId) { this.favId = favId; }
    }
}
