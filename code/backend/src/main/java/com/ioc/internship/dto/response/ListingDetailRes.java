package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingDetailRes {

    private Long id;
    private Long userId;
    private String authorName;
    private Integer authorKarma;
    private String authorStatus;
    private String universityName;
    private String campusName;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String description;
    private BigDecimal price;
    private String transactionType;
    private String conditionStatus;
    private String rentalTerms;
    private BigDecimal depositAmount;
    private String swapTarget;
    private String safeMeetingPoint;
    private String status;
    private Boolean isRiskFlagged;
    private String riskReason;
    private List<String> imageUrls;
    private String moderationReason;
    private LocalDateTime moderatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
