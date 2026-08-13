package com.example.Cab.Booking.System.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.RideLocation;

@Repository
public interface RideLocationRepository extends JpaRepository<RideLocation, Long>{
    List<RideLocation> findByRide(Ride ride);
}