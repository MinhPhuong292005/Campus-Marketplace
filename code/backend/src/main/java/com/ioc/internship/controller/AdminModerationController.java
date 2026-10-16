package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ResolveReportReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.ReportRes;
import com.ioc.internship.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/reports")
@RequiredArgsConstructor
public class AdminModerationController extends BaseController {

    private final ReportService reportService;

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedRes<ReportRes>>> getReports(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedRes<ReportRes> reports = reportService.getReports(status, severity, page, size);
        return success(reports);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportRes>> getReportDetail(@PathVariable Long id) {
        ReportRes report = reportService.getReportById(id);
        return success(report);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<ReportRes>> resolveReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportReq req) {
        ReportRes resolved = reportService.resolveReport(principal.getUserId(), id, req);
        return success(resolved, "Đã xử lý tranh chấp/báo cáo vi phạm thành công!");
    }

    @PostMapping("/dismiss-user/{reportedUserId}")
    public ResponseEntity<ApiResponse<Void>> dismissUserReports(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long reportedUserId) {
        Long adminId = principal != null ? principal.getUserId() : 1L;
        reportService.dismissReportsForUser(adminId, reportedUserId);
        return success(null, "Đã bỏ qua các cảnh báo vi phạm cho tài khoản này.");
    }
}
