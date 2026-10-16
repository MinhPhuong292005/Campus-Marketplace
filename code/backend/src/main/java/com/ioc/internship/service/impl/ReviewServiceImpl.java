package com.ioc.internship.service.impl;

import com.ioc.internship.common.constants.ErrorCodes;
import com.ioc.internship.common.exception.CustomBusinessException;
import com.ioc.internship.dto.request.ReviewCreateReq;
import com.ioc.internship.dto.response.ReviewRes;
import com.ioc.internship.entity.ListingEntity;
import com.ioc.internship.entity.ReviewEntity;
import com.ioc.internship.entity.UserEntity;
import com.ioc.internship.repository.ListingRepository;
import com.ioc.internship.repository.ReviewRepository;
import com.ioc.internship.repository.UserRepository;
import com.ioc.internship.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    @Override
    @Transactional
    public ReviewRes createReview(Long reviewerId, ReviewCreateReq req) {
        if (reviewerId.equals(req.getTargetUserId())) {
            throw new CustomBusinessException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);
        }

        UserEntity reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        UserEntity targetUser = userRepository.findById(req.getTargetUserId())
                .orElseThrow(() -> new CustomBusinessException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND));

        ListingEntity listing = null;
        int karmaAwarded = 0;

        if (req.getListingId() != null) {
            listing = listingRepository.findById(req.getListingId()).orElse(null);
            if (listing != null) {
                // AC4: Mark listing as COMPLETED
                listing.setStatus("COMPLETED");
                listingRepository.save(listing);

                // AC2: Giveaway reward
                if ("GIVEAWAY".equalsIgnoreCase(listing.getTransactionType())) {
                    karmaAwarded += 10;
                }
            }
        }

        // AC1: 5-star transaction reward
        if (req.getRating() != null) {
            if (req.getRating() == 5) {
                karmaAwarded += 5;
            } else if (req.getRating() == 4) {
                karmaAwarded += 3;
            } else if (req.getRating() == 3) {
                karmaAwarded += 1;
            }
        }

        // AC3: Update target user's Karma
        int currentKarma = targetUser.getKarmaScore() != null ? targetUser.getKarmaScore() : 20;
        targetUser.setKarmaScore(currentKarma + karmaAwarded);
        userRepository.save(targetUser);

        // Reviewer bonus (+2 Karma)
        int reviewerKarma = reviewer.getKarmaScore() != null ? reviewer.getKarmaScore() : 20;
        reviewer.setKarmaScore(reviewerKarma + 2);
        userRepository.save(reviewer);

        String tagString = req.getTags() != null ? String.join(",", req.getTags()) : "";

        ReviewEntity entity = ReviewEntity.builder()
                .reviewer(reviewer)
                .targetUser(targetUser)
                .listing(listing)
                .rating(req.getRating())
                .comment(req.getComment())
                .tags(tagString)
                .build();

        ReviewEntity saved = reviewRepository.save(entity);
        log.info("Created review #{} from user #{} to user #{}, awarded +{} Karma",
                saved.getId(), reviewerId, targetUser.getId(), karmaAwarded);

        return mapToRes(saved, karmaAwarded, targetUser.getKarmaScore());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewRes> getReviewsForUser(Long userId) {
        return reviewRepository.findByTargetUserIdOrderByCreatedAtDesc(userId).stream()
                .map(r -> mapToRes(r, 0, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReviewRes> getReviewsForUser(Long userId, Pageable pageable) {
        return reviewRepository.findByTargetUserId(userId, pageable)
                .map(r -> mapToRes(r, 0, null));
    }

    private ReviewRes mapToRes(ReviewEntity r, int karmaAwarded, Integer newKarma) {
        List<String> tagList = (r.getTags() != null && !r.getTags().isBlank())
                ? Arrays.stream(r.getTags().split(",")).map(String::trim).collect(Collectors.toList())
                : Collections.emptyList();

        return ReviewRes.builder()
                .id(r.getId())
                .reviewerId(r.getReviewer().getId())
                .reviewerName(r.getReviewer().getFullName())
                .reviewerAvatar(r.getReviewer().getAvatarUrl())
                .targetUserId(r.getTargetUser().getId())
                .targetUserName(r.getTargetUser().getFullName())
                .listingId(r.getListing() != null ? r.getListing().getId() : null)
                .listingTitle(r.getListing() != null ? r.getListing().getTitle() : null)
                .rating(r.getRating())
                .comment(r.getComment())
                .tags(tagList)
                .karmaAwarded(karmaAwarded)
                .newTargetKarma(newKarma)
                .createdAt(r.getCreatedAt())
                .build();
    }
}
