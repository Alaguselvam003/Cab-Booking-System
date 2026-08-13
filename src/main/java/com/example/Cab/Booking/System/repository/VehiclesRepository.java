package com.example.Cab.Booking.System.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.Cab.Booking.System.entity.Vehicles;
@Repository

public interface VehiclesRepository extends JpaRepository<Vehicles,Long>{
    Optional<Vehicles> findByid(Long id);
}
