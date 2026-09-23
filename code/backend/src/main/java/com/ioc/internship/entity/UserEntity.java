package com.ioc.internship.entity;

import com.ioc.internship.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id")
    private UniversityEntity university;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campus_id")
    private CampusEntity campus;

    @Column(name = "dormitory", length = 100)
    private String dormitory;

    @Column(name = "student_code", length = 30)
    private String studentCode;

    @Column(name = "student_card_verified")
    @Builder.Default
    private Boolean studentCardVerified = false;

    @Column(name = "karma_score")
    @Builder.Default
    private Integer karmaScore = 20;

    @Column(name = "role", length = 30)
    @Builder.Default
    private String role = "ROLE_STUDENT";

    @Column(name = "status", length = 30)
    @Builder.Default
    private String status = "ACTIVE";
}
