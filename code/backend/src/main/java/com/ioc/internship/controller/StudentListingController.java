package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ListingCreateReq;
import com.ioc.internship.dto.request.ListingStatusReq;
import com.ioc.internship.dto.request.ListingUpdateReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.ListingDetailRes;
import com.ioc.internship.service.ListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class StudentListingController extends BaseController {

    private final ListingService listingService;

    @PostMapping("/student/listings")
    public ResponseEntity<ApiResponse<ListingDetailRes>> createListing(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ListingCreateReq req) {
        ListingDetailRes createdListing = listingService.createListing(principal.getUserId(), req);
        return created(createdListing, "Đăng tin thành công! Món đồ của bạn đã hiển thị trên Chợ.");
    }

    @PutMapping("/student/listings/{id}")
    public ResponseEntity<ApiResponse<ListingDetailRes>> updateListing(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ListingUpdateReq req) {
        ListingDetailRes updated = listingService.updateListing(principal.getUserId(), id, req);
        return success(updated, "Cập nhật bài đăng thành công");
    }

    @DeleteMapping("/student/listings/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteListing(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        listingService.deleteListing(principal.getUserId(), id);
        return success(null, "Xóa bài đăng thành công");
    }

    @PatchMapping("/student/listings/{id}/status")
    public ResponseEntity<ApiResponse<ListingDetailRes>> updateListingStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ListingStatusReq req) {
        ListingDetailRes updated = listingService.updateListingStatus(principal.getUserId(), id, req);
        return success(updated, "Cập nhật trạng thái bài đăng thành công");
    }

    @GetMapping("/student/my-listings")
    public ResponseEntity<ApiResponse<Page<ListingDetailRes>>> getMyListings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ListingDetailRes> myListings = listingService.getMyListings(
                principal.getUserId(),
                status,
                PageRequest.of(page, size)
        );
        return success(myListings);
    }

    @GetMapping("/student/listings/search")
    public ResponseEntity<ApiResponse<Page<ListingDetailRes>>> searchListings(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) Long universityId,
            @RequestParam(required = false) java.math.BigDecimal minPrice,
            @RequestParam(required = false) java.math.BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ListingDetailRes> results = listingService.searchListings(
                keyword, categoryId, transactionType, conditionStatus,
                universityId, minPrice, maxPrice, PageRequest.of(page, size)
        );
        return success(results);
    }
}
