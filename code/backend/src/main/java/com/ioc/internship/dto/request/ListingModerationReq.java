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
public class ListingModerationReq {

    @NotBlank(message = "Hành động duyệt không được để trống")
    private String action; // APPROVE, REJECT, REQUEST_EDIT, HIDE

    private String reason; // Preset: "Ảnh vi phạm bản quyền/mờ", "Giá ảo hoặc không minh bạch", "Hàng cấm theo quy chế", "Thông tin sai lệch"

    private String note;
}
