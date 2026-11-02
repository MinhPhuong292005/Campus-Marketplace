package com.ioc.internship.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GiveawayAppointmentReq {

    @NotBlank(message = "Vui lòng chọn thời gian hẹn gặp")
    private String meetingTime;

    @NotBlank(message = "Vui lòng chọn điểm hẹn an toàn tại trường")
    private String meetingPoint;
}

