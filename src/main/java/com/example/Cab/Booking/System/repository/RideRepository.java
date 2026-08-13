package com.example.Cab.Booking.System.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.User;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long>{
    List<Ride> findByPassenger(User passenger);
    List<Ride> findByDriver(Driver driver);
}
