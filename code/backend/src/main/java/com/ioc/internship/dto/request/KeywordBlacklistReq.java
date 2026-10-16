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
public class KeywordBlacklistReq {

    @NotBlank(message = "Từ khóa không được để trống")
    private String keyword;

    @Builder.Default
    private String category = "PROHIBITED_GOODS"; // PROHIBITED_GOODS, SCAM, ACADEMIC_FRAUD, HARASSMENT

    @Builder.Default
    private String severity = "HIGH"; // HIGH, MEDIUM, LOW

    @Builder.Default
    private String action = "AUTO_BLOCK"; // AUTO_BLOCK, FLAG_FOR_REVIEW

    private String reason;
}
