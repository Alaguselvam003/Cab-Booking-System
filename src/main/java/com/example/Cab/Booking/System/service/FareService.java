package com.example.Cab.Booking.System.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

import com.example.Cab.Booking.System.dto.FareEstimateRequest;
import com.example.Cab.Booking.System.dto.FareEstimateResponse;

@Service
public class FareService {

    private static final BigDecimal PER_KM_RATE = BigDecimal.valueOf(15.00);
    private static final BigDecimal MINIMUM_FARE = BigDecimal.valueOf(50.00);
    private static final String CURRENCY_INR = "INR";

    public FareEstimateResponse calculateFare(FareEstimateRequest request) {
        Double distanceKm = request.getDistanceKm();
        if (distanceKm == null) {
            distanceKm = 0.0;
        }

        BigDecimal calculatedFare = BigDecimal.valueOf(distanceKm)
                .multiply(PER_KM_RATE);

        BigDecimal finalFare = calculatedFare.compareTo(MINIMUM_FARE) < 0 
                ? MINIMUM_FARE 
                : calculatedFare;

        finalFare = finalFare.setScale(2, RoundingMode.HALF_UP);

        return new FareEstimateResponse(
                distanceKm,
                finalFare,
                CURRENCY_INR
        );
    }
}
