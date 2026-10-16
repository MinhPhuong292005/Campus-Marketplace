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
public class UniversityReq {

    @NotBlank(message = "Tên trường không được để trống")
    private String name;

    @NotBlank(message = "Tên viết tắt không được để trống")
    private String shortName;

    @NotBlank(message = "Domain email không được để trống")
    private String emailDomains;
}
