package com.ioc.internship.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportRes {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private Long reportedUserId;
    private String reportedUserName;
    private Long reportedListingId;
    private String reportedListingTitle;
    private Long rentalContractId;
    private String reason;
    private String description;
    private String evidenceUrl;
    private String severity;
    private String status;
    private String adminResolution;
    private String actionTaken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
