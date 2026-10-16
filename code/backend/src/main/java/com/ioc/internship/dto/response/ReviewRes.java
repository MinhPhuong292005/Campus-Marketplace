package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRes {
    private Long id;
    private Long reviewerId;
    private String reviewerName;
    private String reviewerAvatar;
    private Long targetUserId;
    private String targetUserName;
    private Long listingId;
    private String listingTitle;
    private Integer rating;
    private String comment;
    private List<String> tags;
    private Integer karmaAwarded;
    private Integer newTargetKarma;
    private LocalDateTime createdAt;
}
