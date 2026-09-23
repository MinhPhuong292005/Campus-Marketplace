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
    private Integer karmaScore;
    private String role;
    private LocalDateTime createdAt;
}
