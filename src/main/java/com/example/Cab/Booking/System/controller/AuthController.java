package com.example.Cab.Booking.System.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.service.AuthService;

import com.example.Cab.Booking.System.dto.RegisterRequest;
import com.example.Cab.Booking.System.dto.ForgotPasswordRequest;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController{
  @Autowired
  private AuthService authService;
  
  @PostMapping("/register")
  public ResponseEntity<User> registerUser(@RequestBody RegisterRequest request){
    User savedUser = authService.register(request);
    return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
  }

  @PostMapping("/login")
    public ResponseEntity<User> loginUser(@RequestBody User user){
        User loggedUser = authService.login(user.getEmail(), user.getPassword());
        return  ResponseEntity.ok(loggedUser);
    }

  @PostMapping("/forgot-password")
  public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
      try {
          authService.resetPassword(request.getEmail(), request.getPhone(), request.getNewPassword());
          return ResponseEntity.ok("Password reset successfully");
      } catch (Exception e) {
          return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
      }
  }

}



