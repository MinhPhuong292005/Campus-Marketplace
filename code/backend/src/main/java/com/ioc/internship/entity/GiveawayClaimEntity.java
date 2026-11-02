package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "giveaway_claims")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiveawayClaimEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private ListingEntity listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private UserEntity requester;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, ACCEPTED, REJECTED, COMPLETED, CANCELLED

    @Column(name = "meeting_time", length = 100)
    private String meetingTime;

    @Column(name = "meeting_point", length = 255)
    private String meetingPoint;

    @Column(name = "giver_confirmed")
    @Builder.Default
    private Boolean giverConfirmed = false;

    @Column(name = "receiver_confirmed")
    @Builder.Default
    private Boolean receiverConfirmed = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

