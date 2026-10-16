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
public class UniversityRes {
    private Long id;
    private String name;
    private String shortName;
    private String emailDomains;
    private List<CampusRes> campuses;
}
