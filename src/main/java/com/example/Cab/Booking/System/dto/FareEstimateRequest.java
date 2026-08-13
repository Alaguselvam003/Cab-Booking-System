package com.example.Cab.Booking.System.dto;

public class FareEstimateRequest {
    private Double distanceKm;
    private Integer durationMinutes;

    public FareEstimateRequest() {}

    public FareEstimateRequest(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public FareEstimateRequest(Double distanceKm, Integer durationMinutes) {
        this.distanceKm = distanceKm;
        this.durationMinutes = durationMinutes;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
}
