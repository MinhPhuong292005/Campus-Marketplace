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
public class NotificationRes {

    private Long id;
    private String title;
    private String message;
    private String type; // LISTING_APPROVED, LISTING_REJECTED, SYSTEM, WARNING
    private Long referenceId;
    private String reason;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
