package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRes {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Long universityId;
    private String universityName;
    private Long campusId;
    private String campusName;
    private String dormitory;
    private String studentCode;
    private String major;
    private String academicYear;
    private String bio;
    private boolean studentCardVerified;
    private Integer karmaScore;
    private String role;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
