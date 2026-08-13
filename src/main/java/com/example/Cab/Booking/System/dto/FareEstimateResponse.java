package com.example.Cab.Booking.System.dto;

import java.math.BigDecimal;

public class FareEstimateResponse {
    private Double distanceKm;
    private BigDecimal fare;
    private String currency;

    public FareEstimateResponse() {}

    public FareEstimateResponse(Double distanceKm, BigDecimal fare, String currency) {
        this.distanceKm = distanceKm;
        this.fare = fare;
        this.currency = currency;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public BigDecimal getFare() {
        return fare;
    }

    public void setFare(BigDecimal fare) {
        this.fare = fare;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
