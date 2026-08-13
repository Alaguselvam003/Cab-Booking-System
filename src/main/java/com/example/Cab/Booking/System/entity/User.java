package com.example.Cab.Booking.System.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;


@Entity
@Table(name= "users")
public class User{
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)

  private Long userId;
  @Column(nullable=false)
  private String name;
  @Column(nullable=false,unique=true)
  private String email;
  @Column(nullable=false)
  private String password;
  private Long phone;
  private String role;

  public User(){}

  public User(Long userId, String name, String email, String password, Long phone, String role){
    this.userId=userId;
    this.name=name;
    this.email=email;
    this.password=password;
    this.phone=phone;
    this.role=role;
  }
  

  public Long getUserId(){
    return userId;
  }
  public void setUserId(Long userId){
    this.userId=userId;
  }
  public String getName(){
    return name;
  }
  public void setName(String name){
    this.name=name;
  }
  public String getEmail(){
    return email;
  }
  public void setEmail(String email){
    this.email=email;
  }
  public String getPassword(){
    return password;
  }
  public void setPassword(String password){
    this.password=password;
  }
  public Long getPhone(){
    return phone;
  }
  public void setPhone(Long phone){
    this.phone=phone;
  }
  public String getRole(){
    return role;
  }
  public void setRole(String role){
    this.role=role;
  }
  
}