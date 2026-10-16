package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwapProposalCreateReq {

    @NotNull(message = "ID bài đăng mang đi đổi không được để trống")
    private Long initiatorListingId;

    @NotNull(message = "ID bài đăng mục tiêu cần đổi không được để trống")
    private Long targetListingId;

    @Builder.Default
    private BigDecimal cashAdjustment = BigDecimal.ZERO;

    private String note;
}
