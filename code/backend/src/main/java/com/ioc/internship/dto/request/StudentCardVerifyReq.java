package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCardVerifyReq {

    @NotBlank(message = "Ảnh mặt trước thẻ sinh viên không được để trống")
    private String frontImageUrl;

    @NotBlank(message = "Ảnh mặt sau thẻ sinh viên không được để trống")
    private String backImageUrl;
}
