package com.example.Cab.Booking.System.controller;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.Cab.Booking.System.service.PassengerService;
import com.example.Cab.Booking.System.entity.Ride;
import com.example.Cab.Booking.System.entity.User;
import com.example.Cab.Booking.System.entity.RideStatus;






@RestController
@RequestMapping("/api/auth/passenger")
@CrossOrigin(origins = "*")
public class PassengerController{
    @Autowired
    private PassengerService passengerService;

    public PassengerController(PassengerService passengerService){
        this.passengerService=passengerService;
    }

    @PostMapping("/ride/request")
    public ResponseEntity<?> requestRide(@RequestBody Ride ride){
        return ResponseEntity.ok(passengerService.requestRide(ride));
    }
    @PostMapping("/fare-estimate")
    public ResponseEntity<?> getFareEstimate(@RequestBody Ride ride){
        return ResponseEntity.ok(passengerService.getFareEstimate(ride));
    }
    @GetMapping("/ride/history/{passengerId}")
    public ResponseEntity<?> getRideHistory(@PathVariable Long passengerId){
        return ResponseEntity.ok(passengerService.getRideHistory(passengerId));
    }
    @GetMapping("/ride/{rideId}/location")
        public ResponseEntity<?> getDriverLocation(@PathVariable Long rideId){
            return ResponseEntity.ok(passengerService.getDriverLocation(rideId));
        }
    
    @PostMapping("/ride/{rideId}/rate")
    public ResponseEntity<?> rideRate(@PathVariable long rideId, @RequestBody Ride ride){
        return ResponseEntity.ok(passengerService.rideRate(rideId, ride));
    }
    @PostMapping("/ride/{rideId}/cancel")
    public ResponseEntity<?> cancelRide(@PathVariable long rideId){
        passengerService.cancelRide(rideId);
        return ResponseEntity.ok("Ride cancelled successfully");
    }

    @PutMapping("/profile/{passengerId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long passengerId, @RequestBody User user) {
        return ResponseEntity.ok(passengerService.updateProfile(passengerId, user));
    }
}
    