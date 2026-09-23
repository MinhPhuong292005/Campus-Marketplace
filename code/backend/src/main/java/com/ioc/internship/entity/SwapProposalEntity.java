package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "swap_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapProposalEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiator_listing_id", nullable = false)
    private ListingEntity initiatorListing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_listing_id", nullable = false)
    private ListingEntity targetListing;

    @Column(name = "cash_adjustment", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cashAdjustment = BigDecimal.ZERO;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, CANCELLED
}
