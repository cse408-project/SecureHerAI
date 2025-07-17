package com.secureherai.secureherai_api.controller;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.secureherai.secureherai_api.dto.fav_place.*;

import com.secureherai.secureherai_api.service.FavoritePlaceService;
import com.secureherai.secureherai_api.service.JwtService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/favorite_place")
public class FavoritePlaceController {

    @Autowired
    private FavoritePlaceService FavoritePlaceService;

    @Autowired
    private JwtService jwtService;    
    @PostMapping("/add")
    public ResponseEntity<FavoritePlaceResponse.GenericResponse> addFavoritePlace(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody FavoritePlaceRequest.AddPlaceInfo request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID userId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to add FavoritePlaces with invalid token"));
                }
                userId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to add FavoritePlaces with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to add FavoritePlaces with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to add FavoritePlaces with invalid token"));
            }
            
            FavoritePlaceResponse.GenericResponse response = FavoritePlaceService.addFavoritePlace(userId, request);
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }



    @GetMapping("")
    public ResponseEntity<Object> getFavoritePlaces(
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to get FavoritePlaces with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to get FavoritePlaces with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to get FavoritePlaces with invalid token"));            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to get FavoritePlaces with invalid token"));
            }
            
            Object response = FavoritePlaceService.getFavoritePlaces(tokenUserId);
            if (response instanceof FavoritePlaceResponse.GetFavoritePlacesResponse) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } 
            catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    @DeleteMapping("/delete")
    public ResponseEntity<FavoritePlaceResponse.GenericResponse> deleteFavoritePlace(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody FavoritePlaceRequest.DeletePlaceInfo request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            }
            
            UUID FavoritePlaceId = UUID.fromString(request.getplace_id());
            FavoritePlaceResponse.GenericResponse response = FavoritePlaceService.deleteFavoritePlace(tokenUserId, FavoritePlaceId);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "Invalid FavoritePlace ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
    

    @GetMapping("/get_one")
    public ResponseEntity<Object> getoneFavoritePlace(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody FavoritePlaceRequest.GetonePlaceInfo request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to delete FavoritePlaces with invalid token"));
            }
            
            UUID FavoritePlaceId = UUID.fromString(request.getplace_id());
            Object response = FavoritePlaceService.getOneFavoritePlace(tokenUserId, FavoritePlaceId);
            
                        
            if (response instanceof FavoritePlaceResponse.GetFavoritePlaceResponse) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }  
        } 
            catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "Invalid FavoritePlace ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }

    @PutMapping("/update")
    public ResponseEntity<FavoritePlaceResponse.GenericResponse> updateFavoritePlace(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody FavoritePlaceRequest.UpdatePlaceInfo request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            // Validate token and extract user ID in one step to catch all JWT exceptions
            UUID tokenUserId;
            try {
                if (!jwtService.isTokenValid(token)) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to update FavoritePlaces with invalid token"));
                }
                tokenUserId = jwtService.extractUserId(token);
            } catch (io.jsonwebtoken.ExpiredJwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to update FavoritePlaces with invalid token"));
            } catch (io.jsonwebtoken.JwtException e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to update FavoritePlaces with invalid token"));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new FavoritePlaceResponse.GenericResponse(false, null, "Unable to update FavoritePlaces with invalid token"));
            }
            
            FavoritePlaceResponse.GenericResponse response = FavoritePlaceService.updateFavoritePlace(tokenUserId, request);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "Invalid FavoritePlace ID format"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new FavoritePlaceResponse.GenericResponse(false, null, "An unexpected error occurred"));
        }
    }
}
