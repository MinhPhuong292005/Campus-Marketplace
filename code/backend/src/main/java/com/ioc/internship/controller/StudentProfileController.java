package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ChangePasswordReq;
import com.ioc.internship.dto.request.UserProfileReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.UserProfileRes;
import com.ioc.internship.service.StudentProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/profile")
@RequiredArgsConstructor
public class StudentProfileController extends BaseController {

    private final StudentProfileService studentProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return success(studentProfileService.getMyProfile(principal.getUserId()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserProfileRes>> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UserProfileReq req) {
        UserProfileRes updated = studentProfileService.updateMyProfile(principal.getUserId(), req);
        return success(updated, "Cập nhật hồ sơ sinh viên thành công");
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordReq req) {
        studentProfileService.changePassword(principal.getUserId(), req);
        return success(null, "Đổi mật khẩu thành công");
    }
}
