package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.SwapProposalCreateReq;
import com.ioc.internship.dto.request.SwapProposalStatusReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.SwapProposalRes;
import com.ioc.internship.service.SwapProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentSwapProposalController extends BaseController {

    private final SwapProposalService swapProposalService;

    @PostMapping("/student/swap-proposals")
    public ResponseEntity<ApiResponse<SwapProposalRes>> createProposal(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SwapProposalCreateReq req) {
        SwapProposalRes res = swapProposalService.createProposal(principal.getUserId(), req);
        return created(res, "Gửi đề xuất đổi đồ thành công!");
    }

    @GetMapping("/student/swap-proposals/my")
    public ResponseEntity<ApiResponse<List<SwapProposalRes>>> getMyProposals(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "all") String type) {
        return success(swapProposalService.getMyProposals(principal.getUserId(), type));
    }

    @PatchMapping("/student/swap-proposals/{id}/status")
    public ResponseEntity<ApiResponse<SwapProposalRes>> updateStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody SwapProposalStatusReq req) {
        SwapProposalRes res = swapProposalService.updateProposalStatus(principal.getUserId(), id, req);
        return success(res, "Cập nhật trạng thái đề xuất thành công");
    }
}
