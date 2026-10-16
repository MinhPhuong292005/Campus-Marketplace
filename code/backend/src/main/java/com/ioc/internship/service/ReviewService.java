package com.ioc.internship.service;

import com.ioc.internship.dto.request.ReviewCreateReq;
import com.ioc.internship.dto.response.ReviewRes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {
    ReviewRes createReview(Long reviewerId, ReviewCreateReq req);
    List<ReviewRes> getReviewsForUser(Long userId);
    Page<ReviewRes> getReviewsForUser(Long userId, Pageable pageable);
}
