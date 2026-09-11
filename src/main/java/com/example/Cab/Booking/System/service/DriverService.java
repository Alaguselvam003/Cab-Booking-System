package com.example.Cab.Booking.System.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.RideLocation;
import com.example.Cab.Booking.System.entity.RideStatus;
import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.repository.DriverRepository;
import com.example.Cab.Booking.System.repository.RideLocationRepository;
import com.example.Cab.Booking.System.repository.RideRepository;
import com.example.Cab.Booking.System.repository.UserRepository;

@Service
public class DriverService {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private RideRepository rideRepository;

    @Autowired
    private RideLocationRepository rideLocationRepository;

    @Autowired
    private UserRepository userRepository;

    public Driver getDriverProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return driverRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
    }

    @Transactional
    public Driver toggleAvailability(Long driverId, boolean available) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setIsAvailable(available);
        return driverRepository.save(driver);
    }

    @Transactional
    public Driver updateLocation(Long driverId, double latitude, double longitude) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setCurrentLatitude(latitude);
        driver.setCurrentLongitude(longitude);
        Driver savedDriver = driverRepository.save(driver);

        List<Ride> activeRides = rideRepository.findByDriver(driver);
        for (Ride ride : activeRides) {
            if (ride.getStatus() == RideStatus.ACCEPTED || ride.getStatus() == RideStatus.ONGOING || ride.getStatus() == RideStatus.IN_RIDE) {
                RideLocation location = new RideLocation(null, ride, latitude, longitude, LocalDateTime.now());
                rideLocationRepository.save(location);
            }
        }
        return savedDriver;
    }

    public List<Ride> getIncomingRides() {
        return rideRepository.findAll().stream()
                .filter(ride -> ride.getStatus() == RideStatus.REQUESTED && ride.getDriver() == null)
                .toList();
    }

    @Transactional
    public Ride acceptRide(Long rideId, Long driverId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        if (ride.getStatus() != RideStatus.REQUESTED) {
            throw new RuntimeException("Ride cannot be accepted. Current status: " + ride.getStatus());
        }
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));

        ride.setDriver(driver);
        ride.setStatus(RideStatus.ACCEPTED);
        driver.setIsAvailable(false);
        driverRepository.save(driver);
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride pickupRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        if (ride.getStatus() != RideStatus.ACCEPTED) {
            throw new RuntimeException("Pickup is only allowed when status is ACCEPTED. Current status: " + ride.getStatus());
        }
        ride.setStatus(RideStatus.ONGOING);
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride startRide(Long rideId) {
        return pickupRide(rideId);
    }

    @Transactional
    public Ride dropRide(Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
        if (ride.getStatus() != RideStatus.ONGOING && ride.getStatus() != RideStatus.IN_RIDE) {
            throw new RuntimeException("Drop is only allowed when status is ONGOING. Current status: " + ride.getStatus());
        }
        ride.setStatus(RideStatus.COMPLETED);
        ride.setCompletedAt(LocalDateTime.now());

        Driver driver = ride.getDriver();
        if (driver != null) {
            driver.setIsAvailable(true);
            driverRepository.save(driver);
        }
        return rideRepository.save(ride);
    }

    @Transactional
    public Ride completeRide(Long rideId) {
        return dropRide(rideId);
    }

    public List<Ride> getRideHistory(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        return rideRepository.findByDriver(driver);
    }

    public Optional<Ride> getActiveRide(Long driverId) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        return rideRepository.findByDriver(driver).stream()
                .filter(ride -> ride.getStatus() == RideStatus.ACCEPTED || ride.getStatus() == RideStatus.ONGOING || ride.getStatus() == RideStatus.IN_RIDE)
                .findFirst();
    }
}
