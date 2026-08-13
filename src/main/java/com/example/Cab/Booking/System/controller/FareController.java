package com.example.Cab.Booking.System.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Cab.Booking.System.dto.FareEstimateRequest;
import com.example.Cab.Booking.System.dto.FareEstimateResponse;
import com.example.Cab.Booking.System.service.FareService;

@RestController
@RequestMapping("/api/fare")
@CrossOrigin(origins = "*")
public class FareController {

    @Autowired
    private FareService fareService;

    @PostMapping("/estimate")
    public ResponseEntity<FareEstimateResponse> getFareEstimate(@RequestBody FareEstimateRequest request) {
        System.out.println("=== BACKEND FARE ESTIMATE REQUEST RECEIVED ===");
        System.out.println("  distanceKm: " + request.getDistanceKm());
        System.out.println("  durationMinutes: " + request.getDurationMinutes());
        FareEstimateResponse estimate = fareService.calculateFare(request);
        System.out.println("  Calculated Fare: " + estimate.getFare());
        System.out.println("================================================");
        return ResponseEntity.ok(estimate);
    }
}
