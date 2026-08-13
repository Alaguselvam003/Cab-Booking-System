package com.example.Cab.Booking.System.entity;


import jakarta.persistence.*;


@Entity
@Table(name="vehicles")
public class Vehicles{
    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Long id;
    private String type;
    @Column(name = "number_plate")
    private String numberplate;
    private int capacity;

    public Vehicles(Long id, String type, String numberplate, int capacity){
        this.id=id;
        this.type=type;
        this.numberplate=numberplate;
        this.capacity=capacity;
    }
    public Vehicles(){}

    public Long getId(){
        return id;
    }
    public void SetId(Long id){
        this.id=id;
    }
    public String getType(){
        return type;
    }
    public void SetType(String type){
        this.type=type;
    }
    public String getNumberplate(){
        return numberplate;
    }
    public void SetNumberplate(String numberplate){
        this.numberplate=numberplate;
    }
    public int getCapacity(){
        return capacity;
    }
    public void SetCapacity(int capacity){
        this.capacity=capacity;
    }


}