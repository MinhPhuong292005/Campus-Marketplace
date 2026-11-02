package com.ioc.internship.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalContractCreateReq {

    @NotNull(message = "listingId is required")
    private Long listingId;

    @NotNull(message = "ownerId is required")
    private Long ownerId;

    @NotNull(message = "startDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd['T'[HH:mm[:ss]]]")
    private LocalDateTime startDate;

    @NotNull(message = "endDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd['T'[HH:mm[:ss]]]")
    private LocalDateTime endDate;

    @NotNull(message = "totalRentAmount is required")
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal totalRentAmount;

    @NotNull(message = "depositAmount is required")
    @DecimalMin(value = "0.0", inclusive = true)
    private BigDecimal depositAmount;
}
