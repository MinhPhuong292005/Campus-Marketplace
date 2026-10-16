package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListingStatusReq {

    @NotBlank(message = "Trạng thái không được để trống")
    @Pattern(regexp = "ACTIVE|RESERVED|COMPLETED|ARCHIVED|DELETED", message = "Trạng thái không hợp lệ")
    private String status;
}
