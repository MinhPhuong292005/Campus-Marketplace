package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "banned_student_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannedStudentCodeEntity extends BaseEntity {

    @Column(name = "student_code", nullable = false, unique = true, length = 50)
    private String studentCode;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "ban_reason", columnDefinition = "TEXT")
    private String banReason;

    @Column(name = "banned_by", length = 150)
    private String bannedBy;

    @Column(name = "banned_at")
    @Builder.Default
    private LocalDateTime bannedAt = LocalDateTime.now();
}
