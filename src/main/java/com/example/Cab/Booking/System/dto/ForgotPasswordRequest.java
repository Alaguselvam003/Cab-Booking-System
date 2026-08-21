package com.example.Cab.Booking.System.dto;

public class ForgotPasswordRequest {
    private String email;
    private Long phone;
    private String newPassword;

    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email, Long phone, String newPassword) {
        this.email = email;
        this.phone = phone;
        this.newPassword = newPassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getPhone() {
        return phone;
    }

    public void setPhone(Long phone) {
        this.phone = phone;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}
