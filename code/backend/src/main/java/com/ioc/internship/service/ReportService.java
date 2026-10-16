package com.ioc.internship.service;

import com.ioc.internship.dto.request.ReportCreateReq;
import com.ioc.internship.dto.request.ResolveReportReq;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.ReportRes;

public interface ReportService {

    ReportRes createReport(Long reporterId, ReportCreateReq req);

    PaginatedRes<ReportRes> getReports(String status, String severity, int page, int size);

    ReportRes getReportById(Long reportId);

    ReportRes resolveReport(Long adminId, Long reportId, ResolveReportReq req);

    void dismissReportsForUser(Long adminId, Long reportedUserId);
}
