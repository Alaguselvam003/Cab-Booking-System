package com.example.Cab.Booking.System.entity;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name="ride_locations")
public class RideLocation{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long locationId;
    @ManyToOne
    @JoinColumn(name = "ride_id")
    private Ride ride;
    private Double latitude;
    private Double longitude;
    private LocalDateTime recordedAt = LocalDateTime.now();

    public RideLocation(){}

    public RideLocation(Long locationId, Ride ride, Double latitude, Double longitude, LocalDateTime recordedAt){
        this.locationId=locationId;
        this.ride=ride;
        this.latitude=latitude;
        this.longitude=longitude;
        this.recordedAt=recordedAt;
    }

    public Long getLocationId(){
        return locationId;
    }
    public void setLocationId(Long locationId){
        this.locationId=locationId;
    }
    public Ride getRide(){
        return ride;
    }
    public void setRide(Ride ride){
        this.ride=ride;
    }
    public Double getLatitude(){
        return latitude;
    }
    public void setLatitude(Double latitude){
        this.latitude=latitude;
    }
    public Double getLongitude(){
        return longitude;
    }
    public void setLongitude(Double longitude){
        this.longitude=longitude;
    }
    public LocalDateTime getRecordedAt(){
        return recordedAt;
    }
    public void setRecordedAt(LocalDateTime recordedAt){
        this.recordedAt=recordedAt;
    }


}