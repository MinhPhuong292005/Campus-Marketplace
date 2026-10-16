package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Public profile response adhering to Decree 13/2023/ND-CP on Personal Data Protection.
 * Strictly hides email, phone number, and student ID card number (MSSV).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicProfileRes {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private String universityName;
    private String campusName;
    private String dormitory;
    private String major;
    private String academicYear;
    private String bio;
    private boolean studentCardVerified;
    private Integer karmaScore;
    private LocalDateTime createdAt;
}
