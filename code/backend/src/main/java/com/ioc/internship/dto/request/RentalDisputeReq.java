package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalDisputeReq {

    @NotBlank(message = "Lý do tranh chấp không được để trống")
    private String disputeReason;
}
