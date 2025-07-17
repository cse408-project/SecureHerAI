package com.secureherai.secureherai_api.dto.favouritePlace;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.secureherai.secureherai_api.dto.sos.LocationDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class FavouritePlaceResponse {
    
    // Generic Response for simple success/error messages
    public static class GenericResponse {
        private boolean success;
        private String message;
        private String error;
        
        public GenericResponse(boolean success, String message, String error) {
            this.success = success;
            this.message = message;
            this.error = error;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
    
    // Get Contacts Response
    public static class GetFavouritePlaceResponse {
        private boolean success;
        private List<FavouritePlaceInfo> favouriteplaces;
        
        public GetFavouritePlaceResponse(boolean success, List<FavouritePlaceInfo> favouriteplaces) {
            this.success = success;
            this.favouriteplaces = favouriteplaces;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public List<FavouritePlaceInfo> getContacts() { return favouriteplaces; }
        public void setContacts(List<FavouritePlaceInfo> favouriteplaces) { this.favouriteplaces = favouriteplaces; }
    }

    // Get Contacts Response
    public static class GetOneFavouritePlaceResponse {
        private boolean success;
        private FavouritePlaceInfo favouriteplace;
        
        public GetOneFavouritePlaceResponse(boolean success, FavouritePlaceInfo favouriteplace) {
            this.success = success;
            this.favouriteplace = favouriteplace;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public FavouritePlaceInfo getFavouritePlaceInfo() { return favouriteplace; }
        public void setFavouritePlaceInfo(FavouritePlaceInfo favouriteplace) { this.favouriteplace = favouriteplace; }
    }

    // Contact Info class (shared between Add and Update)
    public static class FavouritePlaceInfo {
        private String favId;
        private String placeName;
        private LocationDto location;
        private String imageUrl; // URL to profile picture, not base64 data
        private LocalDateTime createdAt;

        public FavouritePlaceInfo() {
        }

        public FavouritePlaceInfo(UUID favId, String placeName, LocationDto location, String imageUrl, LocalDateTime createdAt) {
            this.favId = favId != null? favId.toString(): null;
            this.placeName = placeName;
            this.location = location;
            this.imageUrl = imageUrl;
            this.createdAt = createdAt;
        }

        public String getFavId() {
            return this.favId;
        }

        public void setFavId(String favId) {
            this.favId = favId;
        }

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

        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }   
    
}

