package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatusUpdateReq {

    @NotBlank(message = "Hành động quản trị không được để trống")
    private String action; // SUSPEND, BAN, ACTIVATE, WARN, ADJUST_KARMA

    private Integer karmaAdjustment; // positive or negative points

    private String reason;
}
