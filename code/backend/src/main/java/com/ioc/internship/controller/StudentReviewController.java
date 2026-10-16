package com.ioc.internship.controller;

import com.ioc.internship.common.base.BaseController;
import com.ioc.internship.config.UserPrincipal;
import com.ioc.internship.dto.request.ReviewCreateReq;
import com.ioc.internship.dto.response.ApiResponse;
import com.ioc.internship.dto.response.ReviewRes;
import com.ioc.internship.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class StudentReviewController extends BaseController {

    private final ReviewService reviewService;

    @PostMapping("/student/reviews")
    public ResponseEntity<ApiResponse<ReviewRes>> createReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewCreateReq req) {
        ReviewRes res = reviewService.createReview(principal.getUserId(), req);
        return created(res, "Gửi đánh giá thành công! Điểm Campus Karma đã được cập nhật.");
    }

    @GetMapping("/student/reviews/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReviewRes>>> getReviewsForUser(
            @PathVariable Long userId) {
        return success(reviewService.getReviewsForUser(userId));
    }

    @GetMapping("/student/reviews/user/{userId}/page")
    public ResponseEntity<ApiResponse<Page<ReviewRes>>> getReviewsForUserPaged(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return success(reviewService.getReviewsForUser(userId, PageRequest.of(page, size)));
    }
}
