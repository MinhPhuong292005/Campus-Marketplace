package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportCreateReq {

    private Long reportedUserId;

    private Long reportedListingId;

    private Long rentalContractId;

    @NotBlank(message = "Lý do tố cáo không được để trống")
    private String reason; // BOM_HEN, HANG_GIA, SCAM_COC, NOI_DUNG_CAM, OTHER

    private String description;

    private String evidenceUrl;

    @Builder.Default
    private String severity = "MEDIUM"; // HIGH, MEDIUM, LOW
}
