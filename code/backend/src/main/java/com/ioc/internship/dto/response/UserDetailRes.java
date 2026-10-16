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
public class UserDetailRes {

    private Long id;
    private String fullName;
    private String avatarUrl;
    private Long universityId;
    private String universityName;
    private Long campusId;
    private String campusName;
    private String dormitory;
    private boolean studentCardVerified;
    private String studentCardImageUrl;
    private Integer karmaScore;
    private String email;
    private String phone;
    private String studentCode;
    private String major;
    private String academicYear;
    private String bio;
    private String status;
    private String blockReason;
    private LocalDateTime suspendedUntil;
    private String role;
    private java.util.List<ViolatingItemRes> violatingItems;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ViolatingItemRes {
        private Long id;
        private String type; // LISTING or REPORT
        private String title;
        private String description;
        private String reason;
        private java.util.List<String> imageUrls;
        private LocalDateTime createdAt;
    }
}
