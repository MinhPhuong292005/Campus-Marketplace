package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.dto.response.*;
import com.ioc.internship.service.ListingService;
import com.ioc.internship.service.PublicService;
import com.ioc.internship.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicController extends BaseController {

    private final PublicService publicService;
    private final ListingService listingService;
    private final StudentProfileService studentProfileService;
    private final com.ioc.internship.service.ReviewService reviewService;

    @GetMapping("/universities")
    public ResponseEntity<ApiResponse<List<UniversityRes>>> getUniversities() {
        return success(publicService.getUniversities());
    }

    @GetMapping("/universities/{universityId}/campuses")
    public ResponseEntity<ApiResponse<List<CampusRes>>> getCampuses(@PathVariable Long universityId) {
        return success(publicService.getCampusesByUniversity(universityId));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryRes>>> getCategories() {
        return success(publicService.getCategories());
    }

    @GetMapping("/listings")
    public ResponseEntity<ApiResponse<Page<ListingDetailRes>>> getListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return success(listingService.getAllActiveListings(PageRequest.of(page, size)));
    }

    @GetMapping("/listings/search")
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

    @GetMapping("/listings/{id}")
    public ResponseEntity<ApiResponse<ListingDetailRes>> getListingDetails(@PathVariable Long id) {
        return success(listingService.getListingDetails(id));
    }

    @GetMapping("/listings/{id}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewRes>>> getListingReviews(@PathVariable Long id) {
        return success(reviewService.getReviewsForListing(id));
    }

    @GetMapping("/users/{userId}/reviews")
    public ResponseEntity<ApiResponse<List<ReviewRes>>> getUserReviews(@PathVariable Long userId) {
        return success(reviewService.getReviewsForUser(userId));
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<PublicProfileRes>> getPublicProfile(@PathVariable Long userId) {
        // Decree 13/2023/ND-CP compliance
        return success(studentProfileService.getPublicProfile(userId));
    }

    @GetMapping("/users/{userId}/listings")
    public ResponseEntity<ApiResponse<Page<ListingDetailRes>>> getUserPublicListings(
            @PathVariable Long userId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return success(listingService.getUserPublicListings(userId, transactionType, PageRequest.of(page, size)));
    }
}
