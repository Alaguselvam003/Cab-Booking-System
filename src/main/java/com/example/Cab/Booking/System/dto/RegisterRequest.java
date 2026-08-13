package com.example.Cab.Booking.System.dto;

public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Long phone;
    private String role;

    private Long licensenumber;
    private String vehicleType;
    private String numberplate;
    private Integer capacity;

    public RegisterRequest() {}

    public RegisterRequest(String name, String email, String password, Long phone, String role, Long licensenumber, String vehicleType, String numberplate, Integer capacity) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.role = role;
        this.licensenumber = licensenumber;
        this.vehicleType = vehicleType;
        this.numberplate = numberplate;
        this.capacity = capacity;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Long getPhone() { return phone; }
    public void setPhone(Long phone) { this.phone = phone; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Long getLicensenumber() { return licensenumber; }
    public void setLicensenumber(Long licensenumber) { this.licensenumber = licensenumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getNumberplate() { return numberplate; }
    public void setNumberplate(String numberplate) { this.numberplate = numberplate; }

    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
}
