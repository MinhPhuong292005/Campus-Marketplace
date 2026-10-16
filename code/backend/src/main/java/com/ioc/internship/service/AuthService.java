package com.ioc.internship.service;

import com.ioc.internship.dto.request.LoginReq;
import com.ioc.internship.dto.request.RegisterReq;
import com.ioc.internship.dto.request.SendOtpReq;
import com.ioc.internship.dto.request.VerifyOtpReq;
import com.ioc.internship.dto.response.AuthRes;
import com.ioc.internship.dto.response.UserDetailRes;

public interface AuthService {
    void sendOtp(SendOtpReq req);
    boolean verifyOtp(VerifyOtpReq req);
    AuthRes register(RegisterReq req);
    AuthRes login(LoginReq req);
    AuthRes refreshToken(String refreshToken);
    UserDetailRes getMe(Long userId);
}
