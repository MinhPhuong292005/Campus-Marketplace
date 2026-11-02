package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private CategoryEntity category;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "price", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // SELL, RENT, GIVEAWAY, SWAP

    @Column(name = "condition_status", nullable = false, length = 50)
    private String conditionStatus; // NEW_100, LIKE_NEW_99, GOOD_90, FAIR_70

    @Column(name = "rental_terms", columnDefinition = "TEXT")
    private String rentalTerms;

    @Column(name = "deposit_amount", precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "swap_target", columnDefinition = "TEXT")
    private String swapTarget;

    @Column(name = "safe_meeting_point", length = 255)
    private String safeMeetingPoint;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDING_APPROVAL"; // DRAFT, ACTIVE, RESERVED, COMPLETED, DELETED, REJECTED, PENDING_APPROVAL

    @Column(name = "is_risk_flagged")
    @Builder.Default
    private Boolean isRiskFlagged = false;

    @Column(name = "risk_reason", length = 255)
    private String riskReason;

    @Column(name = "moderation_reason", columnDefinition = "TEXT")
    private String moderationReason;

    @Column(name = "moderated_at")
    private java.time.LocalDateTime moderatedAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ListingImageEntity> images = new ArrayList<>();
}
