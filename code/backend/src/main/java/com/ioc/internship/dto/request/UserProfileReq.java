package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileReq {

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(max = 100, message = "Họ và tên không quá 100 ký tự")
    private String fullName;

    private String phone;
    private String avatarUrl;
    private Long universityId;
    private Long campusId;
    private String dormitory;
    private String studentCode;
    private String major;
    private String academicYear;
    private String bio;
}
