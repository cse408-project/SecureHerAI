package com.secureherai.secureherai_api.dto.fav_place;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;



public class FavoritePlaceRequest {

    
    public static class PlaceInfo {

        
        @NotBlank(message = "place name is required")
        private String placeName;
        
  
        
        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.0", message = "Latitude must be greater than or equal to -90.0")
        @DecimalMax(value = "90.0", message = "Latitude must be less than or equal to 90.0")
        private BigDecimal latitude;
        
        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.0", message = "Longitude must be greater than or equal to -180.0")
        @DecimalMax(value = "180.0", message = "Longitude must be less than or equal to 180.0")
        private BigDecimal longitude;
    
        private String address;

        private String img_url;


        public PlaceInfo(String placeName, BigDecimal longitude,  BigDecimal latitude,String address, String img_url) {
          
            this.placeName = placeName;
            this.latitude = latitude;
            this.longitude = longitude;
            this.address = address;
            this.img_url = img_url;
        }


    

        public String getPlaceName() {
            return this.placeName;
        }

        public void setPlaceName(String placeName) {
            this.placeName = placeName;
        }

        public BigDecimal getLatitude() {
            return this.latitude;
        }

        public void setLatitude(BigDecimal latitude) {
            this.latitude = latitude;
        }

        public BigDecimal getLongitude() {
            return this.longitude;
        }

        public void setLongitude(BigDecimal longitude) {
            this.longitude = longitude;
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
        

 }




    
    
    
    public static class AddPlaceInfo {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @Valid
        @NotNull(message = "place information is required")
        private PlaceInfo place_info;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public PlaceInfo getplace_info() { return place_info; }
        public void setplace_info(PlaceInfo place_info) { this.place_info = place_info; }
    }
    

    public static class DeletePlaceInfo {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "place ID is required")
        private String place_id;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getplace_id() { return place_id; }
        public void setplace_id(String place_id) { this.place_id = place_id; }
    }
    
    // Update Trusted Contact Request
    public static class UpdatePlaceInfo {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "place ID is required")
        private String place_id;
        
        @Valid
        @NotNull(message = "place information is required")
        private PlaceInfo place_info;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getplace_id() { return place_id; }
        public void setplace_id(String place_id) { this.place_id = place_id; }
        
        public PlaceInfo getplace_info() { return place_info; }
        public void setplace_info(PlaceInfo place_info) { this.place_info = place_info; }
    }
    public static class GetonePlaceInfo {
        // userId is now optional since it will be extracted from JWT token
        private String userId;
        
        @NotNull(message = "place ID is required")
        private String place_id;
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public String getplace_id() { return place_id; }
        public void setplace_id(String place_id) { this.place_id = place_id; }
    }
}
