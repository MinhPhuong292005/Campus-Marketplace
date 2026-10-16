package com.ioc.internship.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCardVerifyRes {

    private String fullName;
    private String studentCode;
    private String universityName;
    private Double confidenceScore; // e.g. 96.5%
    private Boolean matched;
    private Boolean autoApproved;
    private Integer karmaAwarded;
    private String message;
}
