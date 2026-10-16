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
public class AuditLogRes {
    private Long id;
    private Long adminId;
    private String adminEmail;
    private String action;
    private String targetType;
    private Long targetId;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;
}
