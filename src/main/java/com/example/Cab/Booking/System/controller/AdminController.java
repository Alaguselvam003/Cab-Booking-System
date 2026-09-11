package com.example.Cab.Booking.System.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.RideStatus;
import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.repository.DriverRepository;
import com.example.Cab.Booking.System.repository.RideRepository;
import com.example.Cab.Booking.System.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/rides")
    public ResponseEntity<List<Ride>> getAllRides() {
        return ResponseEntity.ok(rideRepository.findAll());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getAllDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }

    @GetMapping("/passengers")
    public ResponseEntity<List<User>> getAllPassengers() {
        List<User> passengers = userRepository.findAll().stream()
                .filter(u -> !"driver".equalsIgnoreCase(u.getRole()))
                .toList();
        return ResponseEntity.ok(passengers);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        List<Ride> allRides = rideRepository.findAll();
        List<Driver> allDrivers = driverRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        long totalFleet = allDrivers.size();
        long activeDrivers = driverRepository.findByIsAvailableTrue().size();
        long totalRides = allRides.size();
        long completedRides = allRides.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
        long ongoingRides = allRides.stream().filter(r -> r.getStatus() == RideStatus.ONGOING || r.getStatus() == RideStatus.IN_RIDE || r.getStatus() == RideStatus.ACCEPTED).count();
        long requestedRides = allRides.stream().filter(r -> r.getStatus() == RideStatus.REQUESTED).count();

        BigDecimal totalRevenue = allRides.stream()
                .filter(r -> r.getStatus() == RideStatus.COMPLETED && r.getFare() != null)
                .map(Ride::getFare)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalPassengers = allUsers.stream()
                .filter(u -> !"driver".equalsIgnoreCase(u.getRole()))
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFleet", totalFleet);
        stats.put("activeDrivers", activeDrivers);
        stats.put("totalRides", totalRides);
        stats.put("completedRides", completedRides);
        stats.put("ongoingRides", ongoingRides);
        stats.put("requestedRides", requestedRides);
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalPassengers", totalPassengers);

        return ResponseEntity.ok(stats);
    }
}
