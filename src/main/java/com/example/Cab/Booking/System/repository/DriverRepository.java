package com.example.Cab.Booking.System.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.example.Cab.Booking.System.entity.Driver;
import java.util.Optional;
import com.example.Cab.Booking.System.entity.User;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long>{
    List<Driver> findByIsAvailableTrue();
    Optional<Driver> findByUser(User user);
}
