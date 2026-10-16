package com.ioc.internship.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafeMeetingPointRes {
    private Long id;
    private String name;
    private String address;
    private String campusName;
    private String description;
    private String recommendedHours;
    private Boolean isCctvMonitored;
}
