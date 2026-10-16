package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ReportCreateReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.ReportRes;
import com.ioc.internship.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/reports")
@RequiredArgsConstructor
public class StudentReportController extends BaseController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReportRes>> createReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReportCreateReq req) {
        ReportRes report = reportService.createReport(principal.getUserId(), req);
        return created(report, "Gửi báo cáo vi phạm thành công! Ban quản trị sẽ tiếp nhận và xử lý.");
    }
}
