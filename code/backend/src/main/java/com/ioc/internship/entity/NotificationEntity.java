package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "type", nullable = false, length = 50)
    private String type; // LISTING_APPROVED, LISTING_REJECTED, SYSTEM, WARNING

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;
}
