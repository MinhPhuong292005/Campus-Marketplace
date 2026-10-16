package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AntiFraudCheckRes {
    private Boolean isSuspicious;
    private String riskLevel; // LOW, MEDIUM, HIGH
    private List<String> flaggedKeywords;
    private String warningMessage;
    private String recommendedAction;
}
