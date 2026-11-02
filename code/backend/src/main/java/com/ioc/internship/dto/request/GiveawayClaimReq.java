package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiveawayClaimReq {

    @NotBlank(message = "Vui lòng nhập lý do hoặc lời nhắn xin nhận món đồ tặng")
    private String message;

    private String phone;
}

