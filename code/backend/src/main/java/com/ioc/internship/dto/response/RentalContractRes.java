package com.ioc.internship.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalContractRes {

    private Long id;
    private Long listingId;
    private String listingTitle;
    private Long renterId;
    private String renterName;
    private Integer renterKarma;
    private Long ownerId;
    private String ownerName;
    private Integer ownerKarma;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalRentAmount;
    private BigDecimal depositAmount;
    private List<String> proofImages;
    private String status;
    private String disputeReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
