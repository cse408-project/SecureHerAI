package com.secureherai.secureherai_api.dto.fav_place;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


public class FavoritePlaceResponse {
    
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
    

    
    public static class FavoritePlaceInfo {
        
        private String id;
        private String placeName;
        private BigDecimal longitude;
        private BigDecimal latitude;
        private String address;
        private String img_url;
        private LocalDateTime created_at;
        
        public FavoritePlaceInfo() {}
        

        
        public FavoritePlaceInfo(String id, String placeName, BigDecimal longitude, BigDecimal latitude, 
                          String address, String img_url, LocalDateTime createdAt) {
            
            this.id = id;
            this.placeName = placeName;
            this.longitude = longitude;
            this.latitude = latitude;
            this.address = address;
            this.img_url = img_url;
            this.created_at = createdAt;
        }
        

    public String getid() {
        return this.id;
    }

    public void setid(String id) {
        this.id = id;
    }

    public String getPlaceName() {
        return this.placeName;
    }

    public void setPlaceName(String placeName) {
        this.placeName = placeName;
    }

    public BigDecimal getLongitude() {
        return this.longitude;
    }

    public void setLongitude(BigDecimal longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getLatitude() {
        return this.latitude;
    }

    public void setLatitude(BigDecimal latitude) {
        this.latitude = latitude;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getImg_url() {
        return this.img_url;
    }

    public void setImg_url(String img_url) {
        this.img_url = img_url;
    }

    public LocalDateTime getCreated_at() {
        return this.created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }

        
        
        
        }



    // Get FavoritePlaces Response
    public static class GetFavoritePlacesResponse {
        private boolean success;
        private List<FavoritePlaceInfo> FavoritePlaces;
        
        public GetFavoritePlacesResponse(boolean success, List<FavoritePlaceInfo> FavoritePlaces) {
            this.success = success;
            this.FavoritePlaces = FavoritePlaces;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public List<FavoritePlaceInfo> getFavoritePlaces() { return FavoritePlaces; }
        public void setFavoritePlaces(List<FavoritePlaceInfo> FavoritePlaces) { this.FavoritePlaces = FavoritePlaces; }
    }

        // Get FavoritePlace Response
    public static class GetFavoritePlaceResponse {
        private boolean success;
        private FavoritePlaceInfo FavoritePlace;
        
        public GetFavoritePlaceResponse(boolean success, FavoritePlaceInfo FavoritePlace) {
            this.success = success;
            this.FavoritePlace = FavoritePlace;
        }
        
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        
        public FavoritePlaceInfo getFavoritePlace() { return FavoritePlace; }
        public void setFavoritePlace(FavoritePlaceInfo FavoritePlace) { this.FavoritePlace = FavoritePlace; }
    }
  

    
}
