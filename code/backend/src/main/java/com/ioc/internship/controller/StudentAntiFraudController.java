package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.dto.request.AntiFraudCheckReq;
import com.ioc.internship.dto.response.AntiFraudCheckRes;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.SafeMeetingPointRes;
import com.ioc.internship.service.AntiFraudService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentAntiFraudController extends BaseController {

    private final AntiFraudService antiFraudService;

    @PostMapping("/student/anti-fraud/scan")
    public ResponseEntity<ApiResponse<AntiFraudCheckRes>> scanChatContent(
            @Valid @RequestBody AntiFraudCheckReq req) {
        return success(antiFraudService.scanContent(req), "Kiểm tra an toàn tin nhắn hoàn tất");
    }

    @GetMapping("/student/safe-meeting-points")
    public ResponseEntity<ApiResponse<List<SafeMeetingPointRes>>> getSafeMeetingPoints(
            @RequestParam(required = false) Long campusId) {
        return success(antiFraudService.getSafeMeetingPoints(campusId), "Lấy danh sách điểm hẹn an toàn thành công");
    }
}
