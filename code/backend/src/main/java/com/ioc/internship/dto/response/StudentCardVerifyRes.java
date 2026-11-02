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
    private String dateOfBirth;
    private String major;
    private String faculty;
    private String cohort;
    private String academicYear;
    private Boolean isPhenikaaStandardCard;
    private Boolean barcodeMatched;
    private Double confidenceScore; // e.g. 98.6%
    private Boolean matched;
    private Boolean autoApproved;
    private Integer karmaAwarded;
    private String message;
}
