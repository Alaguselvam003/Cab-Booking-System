package com.example.Cab.Booking.System.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;


@Entity
@Table(name= "rides")
public class Ride{
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name = "ride_id")
    private Long Id;

    @ManyToOne
    @JoinColumn(name="passenger_id")
    private User passenger;

    @ManyToOne
    @JoinColumn(name="driver_id")
    private Driver driver;

    private Double pickupLat;
    private Double pickupLng;
    private Double dropLat;
    private Double dropLng;
    @Enumerated(EnumType.STRING)
    private  RideStatus status;
    private BigDecimal fare;
    private LocalDateTime requestedAt;
    private LocalDateTime completedAt;

    public Ride(){}

    private Integer rating;
    private String feedback;

    public Ride(Long Id, User passenger, Driver driver, Double pickupLat, Double pickupLng, Double dropLat, Double dropLng, RideStatus status, BigDecimal fare, LocalDateTime requestedAt, LocalDateTime completedAt, Integer rating, String feedback){
    this.Id=Id;
    this.passenger=passenger;
    this.driver=driver;
    this.pickupLat=pickupLat;
    this.pickupLng=pickupLng;
    this.dropLat=dropLat;
    this.dropLng=dropLng;
    this.status=status;
    this.fare=fare;
    this.requestedAt=requestedAt;
    this.completedAt=completedAt;
    this.rating=rating;
    this.feedback=feedback;
}

    public Long getId(){
        return Id;
    }

    public void setId(Long Id){
        this.Id=Id;
    }
    public User getPassenger(){
        return passenger;
    }
    public void setPassenger(User passenger){
        this.passenger=passenger;
    }
    public Driver getDriver(){
        return driver;
    }
    public void setDriver(Driver driver){
        this.driver=driver;
    }
    public Double getPickupLat(){
        return pickupLat;
    }
    public void setPickupLat(Double pickupLat){
        this.pickupLat=pickupLat;
    }
    public Double getPickupLng(){
        return pickupLng;
    }
    public void setPickupLng(Double pickupLng){
        this.pickupLng=pickupLng;
    }
    public Double getDropLat(){
        return dropLat;
    }
    public void setDropLat(Double dropLat){
        this.dropLat=dropLat;
    }
    public Double getDropLng(){
        return dropLng;
    }
    public void setDropLng(Double dropLng){
        this.dropLng=dropLng;
    }
    public RideStatus getStatus(){
        return status;
    }
    public void setStatus(RideStatus status){
        this.status=status;
    }
    public BigDecimal getFare(){
        return fare;
    }
    public void setFare(BigDecimal fare){
        this.fare=fare;
    }
    public LocalDateTime getRequestedAt(){
        return requestedAt;
    }
    public void setRequestedAt(LocalDateTime requestedAt){
        this.requestedAt=requestedAt;
    }
    public LocalDateTime getCompletedAt(){
        return completedAt;
    }
    public void setCompletedAt(LocalDateTime completedAt){
        this.completedAt=completedAt;
    }
    public Integer getRating(){
        return rating;
    }
    public void setRating(Integer rating){
        this.rating=rating;
    }
    public String getFeedback(){
        return feedback;
    }
    public void setFeedback(String feedback){
        this.feedback=feedback;
    }
}