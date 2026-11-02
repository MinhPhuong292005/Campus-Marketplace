package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.GiveawayAppointmentReq;
import com.ioc.internship.dto.request.GiveawayClaimReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.GiveawayClaimRes;
import com.ioc.internship.service.GiveawayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student/giveaways")
@RequiredArgsConstructor
public class StudentGiveawayController extends BaseController {

    private final GiveawayService giveawayService;

    @PostMapping("/{listingId}/claims")
    public ResponseEntity<ApiResponse<GiveawayClaimRes>> submitClaim(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long listingId,
            @Valid @RequestBody GiveawayClaimReq req) {
        GiveawayClaimRes res = giveawayService.createClaim(principal.getUserId(), listingId, req);
        return created(res, "Gửi lời nhắn xin nhận món đồ tặng thành công! Chủ bài đăng sẽ xem xét và chọn bạn phù hợp.");
    }

    @GetMapping("/{listingId}/claims")
    public ResponseEntity<ApiResponse<List<GiveawayClaimRes>>> getClaimsByListing(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long listingId) {
        List<GiveawayClaimRes> claims = giveawayService.getClaimsByListing(principal.getUserId(), listingId);
        return success(claims);
    }

    @GetMapping("/my-claims")
    public ResponseEntity<ApiResponse<List<GiveawayClaimRes>>> getMyClaims(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<GiveawayClaimRes> claims = giveawayService.getClaimsByRequester(principal.getUserId());
        return success(claims);
    }

    @PostMapping("/{listingId}/claims/{claimId}/accept")
    public ResponseEntity<ApiResponse<GiveawayClaimRes>> acceptClaim(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long listingId,
            @PathVariable Long claimId) {
        GiveawayClaimRes res = giveawayService.acceptClaim(principal.getUserId(), listingId, claimId);
        return success(res, "Đã chốt tặng món đồ cho bạn " + res.getRequesterName() + "! Hệ thống đã gửi thông báo đến các bên.");
    }

    @PatchMapping("/claims/{claimId}/appointment")
    public ResponseEntity<ApiResponse<GiveawayClaimRes>> updateAppointment(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long claimId,
            @Valid @RequestBody GiveawayAppointmentReq req) {
        GiveawayClaimRes res = giveawayService.updateAppointment(principal.getUserId(), claimId, req);
        return success(res, "Đã cập nhật giờ hẹn và điểm hẹn bàn giao đồ tặng tại Phenikaa!");
    }

    @PostMapping("/claims/{claimId}/confirm")
    public ResponseEntity<ApiResponse<GiveawayClaimRes>> confirmHandover(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long claimId) {
        GiveawayClaimRes res = giveawayService.confirmHandover(principal.getUserId(), claimId);
        String msg = "COMPLETED".equalsIgnoreCase(res.getStatus())
                ? "Giao dịch hoàn tất! Cả hai bạn đều nhận được +5 điểm Campus Karma!"
                : "Bạn đã ấn xác nhận thành công. Vui lòng chờ đối phương xác nhận để hoàn tất giao dịch.";
        return success(res, msg);
    }

    @PostMapping("/claims/{claimId}/cancel")
    public ResponseEntity<ApiResponse<GiveawayClaimRes>> cancelTransaction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long claimId,
            @RequestParam(required = false, defaultValue = "Hủy giao dịch / Không có mặt") String reason) {
        GiveawayClaimRes res = giveawayService.cancelTransaction(principal.getUserId(), claimId, reason);
        return success(res, "Đã hủy giao dịch tặng đồ. Tài khoản báo hủy bị trừ 10 điểm Karma.");
    }
}

