package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCardVerifyReq {

    @NotBlank(message = "Ảnh thẻ sinh viên không được để trống")
    private String frontImageUrl;

    private String backImageUrl;
}
