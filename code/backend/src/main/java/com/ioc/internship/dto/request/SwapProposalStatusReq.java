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
public class SwapProposalStatusReq {

    @NotBlank(message = "Trạng thái đề xuất không được để trống")
    private String status; // ACCEPTED, REJECTED, CANCELLED
}
