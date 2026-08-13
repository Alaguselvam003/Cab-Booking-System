package com.example.Cab.Booking.System.entity;

import jakarta.persistence.*;


@Entity
@Table(name="drivers")
public class Driver{

   @Id
   @Column(name = "driver_id")
    private Long driverId;

    @OneToOne
    @JoinColumn(name="user_id")
    private User user;
    @Column(name = "license_no")
    private Long licensenumber;
    @OneToOne
    @JoinColumn(name="vehicle_id")
    private Vehicles vehicle;
    @Column(name = "is_available")
    private Boolean isAvailable;
    @Column(name = "current_lat")
    private Double currentLatitude;
    @Column(name = "current_lng")
    private Double currentLongitude;

    public Driver(){}
    
    public Driver(Long driverId, User user, Long licensenumber, Vehicles vehicle, Boolean isAvailable, Double currentLatitude, Double currentLongitude){
        this.driverId = driverId;
        this.user = user;
        this.licensenumber = licensenumber;
        this.vehicle = vehicle;
        this.isAvailable = isAvailable;
        this.currentLatitude = currentLatitude;
        this.currentLongitude = currentLongitude;
    }

    public Long getDriverId(){
        return driverId;
    }
    public void setDriverId(Long driverId){
        this.driverId = driverId;
    }
    public User getUser(){
        return user;
    }
    public void setUser(User user){
        this.user = user;
    }
    public Long getLicensenumber(){
        return licensenumber;
    }
    public void setLicensenumber(Long licensenumber){
        this.licensenumber = licensenumber;
    }
    public Vehicles getVehicle(){
        return vehicle;
    }
    public void setVehicle(Vehicles vehicle){
        this.vehicle = vehicle;
    }
    public Boolean getIsAvailable(){
        return isAvailable;
    }
    public void setIsAvailable(Boolean isAvailable){
        this.isAvailable = isAvailable;
    }
    public Double getCurrentLatitude(){
        return currentLatitude;
    }
    public void setCurrentLatitude(Double currentLatitude){
        this.currentLatitude = currentLatitude;
    }
    public Double getCurrentLongitude(){
        return currentLongitude;
    }
    public void setCurrentLongitude(Double currentLongitude){
        this.currentLongitude = currentLongitude;
    }
}