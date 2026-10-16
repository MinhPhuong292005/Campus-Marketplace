package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapProposalRes {

    private Long id;

    // Initiator Item
    private Long initiatorListingId;
    private String initiatorListingTitle;
    private BigDecimal initiatorListingPrice;
    private String initiatorListingImageUrl;
    private Long initiatorUserId;
    private String initiatorUserName;
    private Integer initiatorKarma;

    // Target Item
    private Long targetListingId;
    private String targetListingTitle;
    private BigDecimal targetListingPrice;
    private String targetListingImageUrl;
    private Long targetUserId;
    private String targetUserName;
    private Integer targetKarma;

    // Swap parameters
    private BigDecimal cashAdjustment;
    private String note;
    private String status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
