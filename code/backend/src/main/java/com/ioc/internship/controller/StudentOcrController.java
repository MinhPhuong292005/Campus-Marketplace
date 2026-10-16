package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.StudentCardVerifyReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.StudentCardVerifyRes;
import com.ioc.internship.service.OcrService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/profile/ocr-verify")
@RequiredArgsConstructor
public class StudentOcrController extends BaseController {

    private final OcrService ocrService;

    @PostMapping
    public ResponseEntity<ApiResponse<StudentCardVerifyRes>> verifyStudentCard(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StudentCardVerifyReq req) {
        StudentCardVerifyRes result = ocrService.verifyStudentCard(principal.getUserId(), req);
        return success(result, result.getMessage());
    }
}
