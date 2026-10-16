package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalProofImagesReq {

    @NotNull(message = "Proof images list cannot be null")
    @Size(min = 2, max = 4, message = "Phải cung cấp từ 2 đến 4 hình ảnh chứng minh hiện trạng thiết bị")
    private List<String> proofImages;
}
