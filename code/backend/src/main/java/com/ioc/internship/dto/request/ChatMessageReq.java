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
public class ChatMessageReq {

    @NotNull(message = "ID phòng chat không được để trống")
    private Long chatRoomId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    private String content;

    @Builder.Default
    private String messageType = "TEXT"; // TEXT, IMAGE, OFFER_PRICE, MEETING_POINT
}
