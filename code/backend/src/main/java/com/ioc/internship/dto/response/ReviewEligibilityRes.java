package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewEligibilityRes {
    private boolean canReview;
    private boolean isBuyer;
    private boolean isOwner;
    private boolean alreadyReviewed;
    private String reason;
}
