package com.example.Cab.Booking.System.service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.RideStatus;
import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.repository.RideRepository;
import com.example.Cab.Booking.System.repository.UserRepository;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.example.Cab.Booking.System.repository.RideLocationRepository;
import com.example.Cab.Booking.System.entity.RideLocation;
import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.repository.DriverRepository;

@Service
public class PassengerService{
    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RideLocationRepository rideLocationRepository;

    @Autowired
    private DriverRepository driverRepository;

    public Ride requestRide(Ride ride){
        ride.setStatus(RideStatus.REQUESTED);
        ride.setRequestedAt(LocalDateTime.now());
        if (ride.getFare() == null || ride.getFare().compareTo(BigDecimal.ZERO) <= 0) {
            ride.setFare(BigDecimal.valueOf(getFareEstimate(ride)));
        }
        return rideRepository.save(ride);
    }

    public double getFareEstimate(Ride ride){
        double baseFare = 50.0;
        if (ride.getPickupLat() == null || ride.getPickupLng() == null || ride.getDropLat() == null || ride.getDropLng() == null) {
            return baseFare;
        }
        double latDiff = ride.getDropLat() - ride.getPickupLat();
        double lngDiff = ride.getDropLng() - ride.getPickupLng();
        double distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        double totalFare = baseFare + (distance * 1500.0);
        return Math.round(totalFare * 100.0) / 100.0;
    }

    public List<Ride> getRideHistory(Long passengerId){
        User passenger = userRepository.findById(passengerId).orElseThrow(() -> new RuntimeException("Passenger not found"));
        return rideRepository.findByPassenger(passenger);
    }
    
    public Map<String, Object> getDriverLocation(Long rideId){
        Ride ride=rideRepository.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));
        Map<String, Object> location=new HashMap<>();
        location.put("rideId", rideId);
        location.put("status", ride.getStatus());
        if(ride.getDriver() == null){
            location.put("message", " Driver not assigned yet");
        }else{
            location.put("message","Driver location tracking available");
            location.put("latitude", ride.getDriver().getCurrentLatitude());
            location.put("longitude", ride.getDriver().getCurrentLongitude());
            List<RideLocation> path = rideLocationRepository.findByRide(ride);
            location.put("path", path);
        }
        return location;
    }

    public void cancelRide(Long rideId){
        Ride ride = rideRepository.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));
        ride.setStatus(RideStatus.CANCELLED);
        if (ride.getDriver() != null) {
            Driver driver = ride.getDriver();
            driver.setIsAvailable(true);
            driverRepository.save(driver);
        }
        rideRepository.save(ride);
    }

    public Map<String, Object> rideRate(Long rideId, Ride ride){
        Ride existingRide = rideRepository.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));
        if (existingRide.getStatus() != RideStatus.COMPLETED) {
            throw new RuntimeException("Rating is only allowed after ride completion. Current status: " + existingRide.getStatus());
        }
        existingRide.setRating(ride.getRating());
        existingRide.setFeedback(ride.getFeedback());
        Ride saved = rideRepository.save(existingRide);
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Ride rated successfully");
        result.put("rideId", saved.getId());
        result.put("rating", saved.getRating());
        result.put("feedback", saved.getFeedback());
        return result;
    }

    public User updateProfile(Long userId, User updatedUser) {
        User existingUser = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        existingUser.setName(updatedUser.getName());
        existingUser.setEmail(updatedUser.getEmail());
        if (updatedUser.getPhone() != null) {
            existingUser.setPhone(updatedUser.getPhone());
        }
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().trim().isEmpty()) {
            existingUser.setPassword(updatedUser.getPassword());
        }
        return userRepository.save(existingUser);
    }

}