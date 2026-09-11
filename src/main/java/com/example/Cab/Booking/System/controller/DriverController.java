package com.example.Cab.Booking.System.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.service.DriverService;

@RestController
@RequestMapping("/api/driver")
@CrossOrigin(origins = "*")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @GetMapping("/profile/{userId}")
    public ResponseEntity<Driver> getDriverProfile(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(driverService.getDriverProfile(userId));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{driverId}/availability")
    public ResponseEntity<Driver> toggleAvailability( @PathVariable Long driverId, @RequestBody Map<String, Boolean> payload) {
        Boolean available = payload.get("available");
        if (available == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(driverService.toggleAvailability(driverId, available));
    }

    @PostMapping("/{driverId}/location")
    public ResponseEntity<Driver> updateLocation(
            @PathVariable Long driverId,
            @RequestBody Map<String, Double> payload) {
        Double latitude = payload.get("latitude");
        Double longitude = payload.get("longitude");
        if (latitude == null || longitude == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(driverService.updateLocation(driverId, latitude, longitude));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<Ride>> getIncomingRides() {
        return ResponseEntity.ok(driverService.getIncomingRides());
    }

    @PostMapping("/{driverId}/accept/{rideId}")
    public ResponseEntity<Ride> acceptRide(@PathVariable Long driverId, @PathVariable Long rideId) {
        try {
            return ResponseEntity.ok(driverService.acceptRide(rideId, driverId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/ride/{rideId}/pickup")
    public ResponseEntity<Ride> pickupRide(@PathVariable Long rideId) {
        try {
            return ResponseEntity.ok(driverService.pickupRide(rideId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/ride/{rideId}/start")
    public ResponseEntity<Ride> startRide(@PathVariable Long rideId) {
        try {
            return ResponseEntity.ok(driverService.startRide(rideId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/ride/{rideId}/drop")
    public ResponseEntity<Ride> dropRide(@PathVariable Long rideId) {
        try {
            return ResponseEntity.ok(driverService.dropRide(rideId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/ride/{rideId}/complete")
    public ResponseEntity<Ride> completeRide(@PathVariable Long rideId) {
        try {
            return ResponseEntity.ok(driverService.completeRide(rideId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{driverId}/history")
    public ResponseEntity<List<Ride>> getRideHistory(@PathVariable Long driverId) {
        return ResponseEntity.ok(driverService.getRideHistory(driverId));
    }

    @GetMapping("/{driverId}/active-ride")
    public ResponseEntity<?> getActiveRide(@PathVariable Long driverId) {
        Optional<Ride> activeRide = driverService.getActiveRide(driverId);
        if (activeRide.isPresent()) {
            return ResponseEntity.ok(activeRide.get());
        }
        return ResponseEntity.noContent().build();
    }
}
