package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogEntity extends BaseEntity {

    @Column(name = "admin_id", nullable = false)
    private Long adminId;

    @Column(name = "admin_email", nullable = false, length = 150)
    private String adminEmail;

    @Column(name = "action", nullable = false, length = 50)
    private String action; // APPROVE_LISTING, REJECT_LISTING, BAN_USER, SUSPEND_USER, RESOLVE_REPORT, etc.

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType; // LISTING, USER, REPORT, CATEGORY, SYSTEM

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "details", columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;
}
