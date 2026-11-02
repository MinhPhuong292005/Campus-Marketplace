package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.RentalContractCreateReq;
import com.ioc.internship.dto.request.RentalDisputeReq;
import com.ioc.internship.dto.request.RentalProofImagesReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.PaginatedRes;
import com.ioc.internship.dto.response.RentalContractRes;
import com.ioc.internship.service.RentalContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/student/rentals")
@RequiredArgsConstructor
public class StudentRentalController extends BaseController {

    private final RentalContractService rentalContractService;

    @PostMapping
    public ResponseEntity<ApiResponse<RentalContractRes>> createRentalContract(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RentalContractCreateReq req) {
        RentalContractRes contract = rentalContractService.createRentalContract(principal.getUserId(), req);
        return created(contract, "Tạo hợp đồng thuê đồ thành công!");
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedRes<RentalContractRes>>> getMyRentals(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PaginatedRes<RentalContractRes> rentals = rentalContractService.getMyRentalContracts(principal.getUserId(), status, page, size);
        return success(rentals);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RentalContractRes>> getRentalDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RentalContractRes contract = rentalContractService.getRentalContractById(principal.getUserId(), id);
        return success(contract);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<RentalContractRes>> approveRentalContract(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RentalContractRes contract = rentalContractService.approveRentalContract(principal.getUserId(), id);
        return success(contract, "Đã chấp thuận yêu cầu thuê đồ. Hai bạn có thể hẹn giờ giao nhận.");
    }

    @PutMapping("/{id}/handover")
    public ResponseEntity<ApiResponse<RentalContractRes>> confirmHandover(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RentalContractRes contract = rentalContractService.confirmHandover(principal.getUserId(), id);
        return success(contract, "Đã xác nhận giao nhận đồ. Hợp đồng chuyển sang trạng thái Đang giao dịch!");
    }

    @PutMapping("/{id}/proof")
    public ResponseEntity<ApiResponse<RentalContractRes>> uploadProofImages(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RentalProofImagesReq req) {
        RentalContractRes contract = rentalContractService.uploadProofImages(principal.getUserId(), id, req);
        return success(contract, "Đã lưu 2-4 ảnh hiện trạng bàn giao thiết bị. Hợp đồng chuyển sang ACTIVE!");
    }

    @PutMapping("/{id}/return")
    public ResponseEntity<ApiResponse<RentalContractRes>> confirmReturnAndRefundDeposit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        RentalContractRes contract = rentalContractService.confirmReturnAndRefundDeposit(principal.getUserId(), id);
        return success(contract, "Xác nhận trả đồ & hoàn cọc thành công! Cả 2 bên nhận +5 Karma.");
    }

    @PutMapping("/{id}/dispute")
    public ResponseEntity<ApiResponse<RentalContractRes>> reportDispute(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody RentalDisputeReq req) {
        RentalContractRes contract = rentalContractService.reportDispute(principal.getUserId(), id, req);
        return success(contract, "Đã gửi báo cáo tranh chấp cọc đến ban quản trị.");
    }
}
