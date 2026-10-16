package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusReq {

    @NotNull(message = "Trường đại học không được để trống")
    private Long universityId;

    @NotBlank(message = "Tên cơ sở / KTX không được để trống")
    private String name;

    private String location;
}
