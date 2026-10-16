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
public class StudentCardReviewReq {

    @NotBlank(message = "Hành động xác thực không được để trống")
    private String action; // APPROVE, REVOKE, REJECT

    @Builder.Default
    private Integer karmaAward = 15;

    private String reason;
}
