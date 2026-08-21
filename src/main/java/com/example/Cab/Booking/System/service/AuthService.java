package com.example.Cab.Booking.System.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.repository.UserRepository;

import org.springframework.transaction.annotation.Transactional;
import com.example.Cab.Booking.System.dto.RegisterRequest;
import com.example.Cab.Booking.System.entity.Driver;
import com.example.Cab.Booking.System.entity.Vehicles;
import com.example.Cab.Booking.System.repository.DriverRepository;
import com.example.Cab.Booking.System.repository.VehiclesRepository;

@Service
public class AuthService{
   @Autowired
   private UserRepository userRepository;

   @Autowired
   private DriverRepository driverRepository;

   @Autowired
   private VehiclesRepository vehiclesRepository;

   @Transactional
   public User register(RegisterRequest request) {
      if (userRepository.existsByEmail(request.getEmail())) {
          throw new RuntimeException("Email already exists");
      }
      User user = new User();
      user.setName(request.getName());
      user.setEmail(request.getEmail());
      user.setPassword(request.getPassword());
      user.setPhone(request.getPhone());
      user.setRole(request.getRole());
      User savedUser = userRepository.save(user);

      if ("driver".equalsIgnoreCase(request.getRole())) {
          Vehicles vehicle = new Vehicles();
          vehicle.SetType(request.getVehicleType());
          vehicle.SetNumberplate(request.getNumberplate() != null ? request.getNumberplate() : "0");
          vehicle.SetCapacity(request.getCapacity() != null ? request.getCapacity() : 4);
          Vehicles savedVehicle = vehiclesRepository.save(vehicle);

          Driver driver = new Driver();
          driver.setDriverId(savedUser.getUserId());
          driver.setUser(savedUser);
          driver.setLicensenumber(request.getLicensenumber() != null ? request.getLicensenumber() : 0L);
          driver.setVehicle(savedVehicle);
          driver.setIsAvailable(true);
          driver.setCurrentLatitude(0.0);
          driver.setCurrentLongitude(0.0);
          driverRepository.save(driver);
      }
      return savedUser;
   }

   @Transactional
   public void resetPassword(String email, Long phone, String newPassword) {
       User user = userRepository.findByEmail(email)
           .orElseThrow(() -> new RuntimeException("User not found with this email"));
       if (user.getPhone() == null || !user.getPhone().equals(phone)) {
           throw new RuntimeException("Phone number does not match registered phone number");
       }
       user.setPassword(newPassword);
       userRepository.save(user);
   }

   public User login(String email, String password){

    Optional<User> user = userRepository.findByEmail(email);

    if(user.isPresent() && user.get().getPassword().equals(password)){
        return user.get();
    }
    throw new RuntimeException("Invalid Email or Password");
   }
}

