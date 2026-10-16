package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private UserEntity reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private UserEntity reportedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_listing_id")
    private ListingEntity reportedListing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_contract_id")
    private RentalContractEntity rentalContract;

    @Column(name = "reason", length = 50, nullable = false)
    private String reason; // BOM_HEN, HANG_GIA, SCAM_COC, NOI_DUNG_CAM, OTHER

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "evidence_url", columnDefinition = "TEXT")
    private String evidenceUrl;

    @Column(name = "severity", length = 20)
    @Builder.Default
    private String severity = "MEDIUM"; // HIGH, MEDIUM, LOW

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, RESOLVED, REJECTED

    @Column(name = "admin_resolution", columnDefinition = "TEXT")
    private String adminResolution;

    @Column(name = "action_taken", length = 50)
    private String actionTaken; // PENALIZE_KARMA, BAN_USER, REMOVE_LISTING, REJECTED
}
