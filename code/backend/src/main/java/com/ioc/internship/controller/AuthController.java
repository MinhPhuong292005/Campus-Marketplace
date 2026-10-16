package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.LoginReq;
import com.ioc.internship.dto.request.RegisterReq;
import com.ioc.internship.dto.request.SendOtpReq;
import com.ioc.internship.dto.request.VerifyOtpReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.AuthRes;
import com.ioc.internship.dto.response.UserDetailRes;
import com.ioc.internship.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController extends BaseController {

    private final AuthService authService;

    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody SendOtpReq req) {
        authService.sendOtp(req);
        return success(null, "Mã OTP đã được gửi tới email trường của bạn (hiệu lực 5 phút)");
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody VerifyOtpReq req) {
        boolean verified = authService.verifyOtp(req);
        return success(verified, "Xác thực mã OTP thành công");
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthRes>> register(@Valid @RequestBody RegisterReq req,
                                                         HttpServletResponse response) {
        AuthRes authRes = authService.register(req);
        setRefreshTokenCookie(response, authRes.getRefreshToken());
        return created(authRes, "Đăng ký thành công! Bạn nhận được +20 điểm Campus Karma ban đầu.");
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthRes>> login(@Valid @RequestBody LoginReq req,
                                                      HttpServletResponse response) {
        AuthRes authRes = authService.login(req);
        setRefreshTokenCookie(response, authRes.getRefreshToken());
        return success(authRes, "Đăng nhập thành công vào Campus Marketplace");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthRes>> refresh(
            @CookieValue(name = "refresh_token", required = false) String cookieRefreshToken,
            @RequestBody(required = false) AuthRes bodyReq,
            HttpServletResponse response) {
        String refreshToken = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : (bodyReq != null ? bodyReq.getRefreshToken() : null);

        AuthRes authRes = authService.refreshToken(refreshToken);
        setRefreshTokenCookie(response, authRes.getRefreshToken());
        return success(authRes, "Làm mới phiên đăng nhập thành công");
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false) // Set to true in HTTPS
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return success(null, "Đăng xuất thành công");
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDetailRes>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return error(40100, "Chưa đăng nhập", org.springframework.http.HttpStatus.UNAUTHORIZED);
        }
        UserDetailRes user = authService.getMe(principal.getUserId());
        return success(user);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        if (refreshToken != null) {
            // AC4: HttpOnly cookie for Refresh Token to protect against XSS
            ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(7 * 24 * 60 * 60) // 7 days
                    .sameSite("Lax")
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        }
    }
}
