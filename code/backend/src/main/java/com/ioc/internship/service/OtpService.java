package com.ioc.internship.service;

public interface OtpService {
    void sendOtp(String email);
    boolean verifyOtp(String email, String otp);
}
