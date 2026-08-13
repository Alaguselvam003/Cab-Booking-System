package com.example.Cab.Booking.System.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

import com.example.Cab.Booking.System.dto.FareEstimateRequest;
import com.example.Cab.Booking.System.dto.FareEstimateResponse;

public class FareServiceTest {

    private final FareService fareService = new FareService();

    @Test
    public void testCalculateFare() {
        FareEstimateRequest request = new FareEstimateRequest(10.0);
        FareEstimateResponse response = fareService.calculateFare(request);

        assertNotNull(response);
        assertEquals(10.0, response.getDistanceKm());
        assertEquals(new BigDecimal("150.00"), response.getFare());
        assertEquals("INR", response.getCurrency());
    }

    @Test
    public void testCalculateFareWithMinimumFare() {
        FareEstimateRequest request = new FareEstimateRequest(2.0);
        FareEstimateResponse response = fareService.calculateFare(request);

        assertNotNull(response);
        assertEquals(2.0, response.getDistanceKm());
        assertEquals(new BigDecimal("50.00"), response.getFare());
        assertEquals("INR", response.getCurrency());
    }

    @Test
    public void testCalculateFareWithNullValues() {
        FareEstimateRequest request = new FareEstimateRequest(null);
        FareEstimateResponse response = fareService.calculateFare(request);

        assertNotNull(response);
        assertEquals(0.0, response.getDistanceKm());
        assertEquals(new BigDecimal("50.00"), response.getFare());
        assertEquals("INR", response.getCurrency());
    }
}
